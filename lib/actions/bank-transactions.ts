"use server";

import { revalidatePath } from "next/cache";
import { BankTransactionMatchStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const PAIRABLE_STATUSES = new Set<BankTransactionMatchStatus>([
    BankTransactionMatchStatus.UNKNOWN_VS,
    BankTransactionMatchStatus.NO_VARIABLE_SYMBOL,
]);

export async function pairTransactionWithOrder(
    transactionId: string,
    orderId: string,
): Promise<{ error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const transaction = await db.bankTransaction.findUnique({
        where: { id: transactionId },
        select: {
            id: true,
            matchStatus: true,
            amount: true,
            date: true,
        },
    });

    if (!transaction) {
        return { error: "Transakce nenalezena" };
    }

    if (!PAIRABLE_STATUSES.has(transaction.matchStatus)) {
        return { error: "Transakce je již spárovaná" };
    }

    const order = await db.v2Order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            yearId: true,
            isPaid: true,
            totalPrice: true,
            legacySubmissionId: true,
        },
    });

    if (!order) {
        return { error: "Registrace nenalezena" };
    }

    if (order.isPaid) {
        return { error: "Registrace je již zaplacena" };
    }

    const totalPrice = order.totalPrice ?? 0;
    let matchStatus: BankTransactionMatchStatus;

    if (transaction.amount < totalPrice) {
        matchStatus = BankTransactionMatchStatus.PARTIAL_PAYMENT;
    } else if (transaction.amount > totalPrice) {
        matchStatus = BankTransactionMatchStatus.OVERPAYMENT;
    } else {
        matchStatus = BankTransactionMatchStatus.MATCHED;
    }

    const shouldMarkPaid =
        matchStatus === BankTransactionMatchStatus.MATCHED ||
        matchStatus === BankTransactionMatchStatus.OVERPAYMENT;

    try {
        await db.$transaction(async (txn) => {
            await txn.bankTransaction.update({
                where: { id: transactionId },
                data: {
                    orderId: order.id,
                    yearId: order.yearId,
                    submissionId:
                        order.legacySubmissionId,
                    matchStatus,
                    processedAt: new Date(),
                },
            });

            if (shouldMarkPaid) {
                await txn.v2Order.update({
                    where: { id: order.id },
                    data: {
                        isPaid: true,
                        paidAt: transaction.date,
                    },
                });

                if (order.legacySubmissionId) {
                    await txn.registrationSubmission.update(
                        {
                            where: {
                                id: order.legacySubmissionId,
                            },
                            data: {
                                isPaid: true,
                                paidAt: transaction.date,
                            },
                        },
                    );
                }
            }
        });

        revalidatePath(
            `/admin/rocniky/${order.yearId}/registrace`,
        );
        return {};
    } catch (error) {
        console.error("Failed to pair transaction:", error);
        return { error: "Operace selhala" };
    }
}
