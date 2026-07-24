import { Container, Box, Alert, Button } from "@mui/material";
import { Download } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionsTable } from "@/components/admin/submissions-table";
import {
    SubmissionsCountProvider,
    SubmissionsCountChip,
} from "@/components/admin/submissions-count-context";
import { FieldValueFilter } from "@/components/admin/field-value-filter";
import { ValidatePaymentsButton } from "@/components/admin/validate-payments-button";
import { LinkButton } from "@/components/ui/link-button";
import {
    getFormStructure,
    getOrdersForYear,
    v2FieldToInputField,
    v2PricingDefsToPricingDefs,
} from "@/lib/services/v2";
import { getFieldOptionValues } from "@/lib/utils/pricing";

type TestFilter = "real" | "test" | "all";

interface PrihlaskyPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        status?: string;
        paid?: string;
        field?: string;
        value?: string;
        test?: string;
    }>;
}

export default async function PrihlaskyPage({
    params,
    searchParams,
}: PrihlaskyPageProps) {
    const session = await requireEditor();
    const isEditor = session.user?.role === "EDITOR";
    const { id } = await params;
    const {
        status,
        paid,
        field: fieldParam,
        value: valueParam,
        test,
    } = await searchParams;

    const testFilter: TestFilter = isEditor
        ? "test"
        : test === "test" || test === "all"
          ? test
          : "real";

    const year = await db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            startDate: true,
        },
    });

    if (!year) {
        notFound();
    }

    const formStructure = await getFormStructure(year.id);

    if (!formStructure) {
        return (
            <Container maxWidth="xl">
                <PageHeader
                    breadcrumbs={[
                        {
                            label: "Ročníky",
                            href: "/admin/rocniky",
                        },
                        {
                            label: `${year.year}`,
                            href: `/admin/rocniky/${year.id}`,
                        },
                        {
                            label: "Registrace",
                            href: `/admin/rocniky/${year.id}/registrace`,
                        },
                        { label: "Přihlášky" },
                    ]}
                    title="Přihlášky"
                />
                <Alert severity="info" sx={{ mb: 2 }}>
                    Pro zobrazení přihlášek je nutné
                    nejprve vytvořit registrační formulář.
                </Alert>
                <LinkButton
                    href={`/admin/rocniky/${id}/registrace/formular`}
                    variant="contained"
                >
                    Vytvořit formulář
                </LinkButton>
            </Container>
        );
    }

    const orders = await getOrdersForYear(year.id, {
        isTest:
            testFilter === "real"
                ? false
                : testFilter === "test"
                  ? true
                  : null,
    });

    const allInputFields =
        formStructure.fields.map(v2FieldToInputField);
    const pricingDefinitions = v2PricingDefsToPricingDefs(
        formStructure.pricingDefinitions,
    );

    const displayFields = formStructure.fields
        .slice(0, 4)
        .map((f) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            includeForAdditionalPeople:
                f.includeForAdditionalPeople,
        }));

    const allFieldsInfo = formStructure.fields.map(
        (f) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            includeForAdditionalPeople:
                f.includeForAdditionalPeople,
        }),
    );

    const statusFilter =
        status &&
        [
            "PENDING",
            "CONFIRMED",
            "WAITLIST",
            "CANCELLED",
            "REJECTED",
        ].includes(status)
            ? status
            : null;
    const paidFilter =
        paid === "true"
            ? true
            : paid === "false"
              ? false
              : null;

    const filterableFields = allInputFields
        .filter((f) =>
            [
                "select",
                "radio",
                "pricing_select",
                "pricing_multi_select",
                "checkbox",
            ].includes(f.type),
        )
        .map((f) => {
            const options =
                f.type === "checkbox"
                    ? ["Ano", "Ne"]
                    : getFieldOptionValues(
                          f,
                          pricingDefinitions,
                      );
            return {
                name: f.name,
                label: f.label,
                type: f.type,
                options,
            };
        })
        .filter((f) => f.options.length > 0);

    const matchedField = fieldParam
        ? filterableFields.find(
              (f) => f.name === fieldParam,
          )
        : null;
    const fieldFilter = matchedField
        ? matchedField.name
        : null;
    const valueFilter =
        matchedField &&
        valueParam &&
        matchedField.options.includes(valueParam)
            ? valueParam
            : null;

    const basePath = `/admin/rocniky/${id}/registrace/prihlasky`;
    const statusParam = statusFilter
        ? `status=${statusFilter}`
        : "";
    const paidParam =
        paid === "true" || paid === "false"
            ? `paid=${paid}`
            : "";
    const fieldFilterParam =
        fieldFilter && valueFilter
            ? `field=${encodeURIComponent(fieldFilter)}`
            : "";
    const valueFilterParam =
        fieldFilter && valueFilter
            ? `value=${encodeURIComponent(valueFilter)}`
            : "";
    const testParam =
        testFilter !== "real"
            ? `test=${testFilter}`
            : "";
    const hasActiveFilter =
        statusFilter !== null ||
        paidFilter !== null ||
        (fieldFilter !== null && valueFilter !== null) ||
        testFilter !== "real";
    const filterQueryString = [
        statusParam,
        paidParam,
        fieldFilterParam,
        valueFilterParam,
        testParam,
    ]
        .filter(Boolean)
        .join("&");

    return (
        <Container maxWidth="xl">
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${year.year}`,
                        href: `/admin/rocniky/${year.id}`,
                    },
                    {
                        label: "Registrace",
                        href: `/admin/rocniky/${year.id}/registrace`,
                    },
                    { label: "Přihlášky" },
                ]}
                title="Přihlášky"
            />
            <SubmissionsCountProvider>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                }}
            >
                <SubmissionsCountChip total={orders.length} />
                {!isEditor && (
                    <>
                        <LinkButton
                            href={`/api/registrace/${year.id}/export`}
                            variant="outlined"
                            startIcon={<Download />}
                            size="small"
                        >
                            Export CSV
                        </LinkButton>
                        {hasActiveFilter && (
                            <LinkButton
                                href={`/api/registrace/${year.id}/export?${filterQueryString}`}
                                variant="outlined"
                                startIcon={<Download />}
                                size="small"
                            >
                                Export filtrovaných CSV
                            </LinkButton>
                        )}
                        <ValidatePaymentsButton />
                    </>
                )}
            </Box>
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                    flexWrap: "wrap",
                }}
            >
                <LinkButton
                    href={`${basePath}?${[paidParam, testParam].filter(Boolean).join("&") || ""}`}
                    variant={
                        !statusFilter
                            ? "contained"
                            : "outlined"
                    }
                    size="small"
                >
                    Vše
                </LinkButton>
                {(
                    [
                        "PENDING",
                        "CONFIRMED",
                        "WAITLIST",
                        "CANCELLED",
                        "REJECTED",
                    ] as const
                ).map((s) => {
                    const p = [
                        `status=${s}`,
                        ...(paidParam ? [paidParam] : []),
                        ...(testParam
                            ? [testParam]
                            : []),
                    ].join("&");
                    return (
                        <LinkButton
                            key={s}
                            href={`${basePath}?${p}`}
                            variant={
                                statusFilter === s
                                    ? "contained"
                                    : "outlined"
                            }
                            size="small"
                        >
                            {
                                {
                                    PENDING: "Čeká",
                                    CONFIRMED: "Potvrzeno",
                                    WAITLIST:
                                        "Čekací listina",
                                    CANCELLED: "Zrušeno",
                                    REJECTED: "Zamítnuto",
                                }[s]
                            }
                        </LinkButton>
                    );
                })}
            </Box>
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                    flexWrap: "wrap",
                }}
            >
                <LinkButton
                    href={`${basePath}?${[statusParam, testParam].filter(Boolean).join("&") || ""}`}
                    variant={
                        paidFilter === null
                            ? "contained"
                            : "outlined"
                    }
                    size="small"
                >
                    Vše
                </LinkButton>
                <LinkButton
                    href={`${basePath}?${[statusParam, "paid=true", testParam].filter(Boolean).join("&")}`}
                    variant={
                        paidFilter === true
                            ? "contained"
                            : "outlined"
                    }
                    size="small"
                >
                    Zaplaceno
                </LinkButton>
                <LinkButton
                    href={`${basePath}?${[statusParam, "paid=false", testParam].filter(Boolean).join("&")}`}
                    variant={
                        paidFilter === false
                            ? "contained"
                            : "outlined"
                    }
                    size="small"
                >
                    Nezaplaceno
                </LinkButton>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                    flexWrap: "wrap",
                }}
            >
                {isEditor ? (
                    <>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled
                        >
                            Reálné
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            disabled
                        >
                            Testovací
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled
                        >
                            Vše (vč. test)
                        </Button>
                    </>
                ) : (
                    <>
                        <LinkButton
                            href={`${basePath}?${[statusParam, paidParam].filter(Boolean).join("&") || ""}`}
                            variant={
                                testFilter === "real"
                                    ? "contained"
                                    : "outlined"
                            }
                            size="small"
                        >
                            Reálné
                        </LinkButton>
                        <LinkButton
                            href={`${basePath}?${[statusParam, paidParam, "test=test"].filter(Boolean).join("&")}`}
                            variant={
                                testFilter === "test"
                                    ? "contained"
                                    : "outlined"
                            }
                            size="small"
                        >
                            Testovací
                        </LinkButton>
                        <LinkButton
                            href={`${basePath}?${[statusParam, paidParam, "test=all"].filter(Boolean).join("&")}`}
                            variant={
                                testFilter === "all"
                                    ? "contained"
                                    : "outlined"
                            }
                            size="small"
                        >
                            Vše (vč. test)
                        </LinkButton>
                    </>
                )}
            </Box>
            {filterableFields.length > 0 && (
                <FieldValueFilter
                    basePath={basePath}
                    fields={filterableFields}
                    activeField={fieldFilter}
                    activeValue={valueFilter}
                    otherParams={[
                        statusParam,
                        paidParam,
                        testParam,
                    ]
                        .filter(Boolean)
                        .join("&")}
                />
            )}
            <SubmissionsTable
                orders={orders}
                displayFields={displayFields}
                allFields={allFieldsInfo}
                yearId={year.id}
                statusFilter={statusFilter}
                paidFilter={paidFilter}
                fieldFilter={fieldFilter}
                valueFilter={valueFilter}
                eventStartDate={year.startDate}
                readOnly={isEditor}
            />
            </SubmissionsCountProvider>
        </Container>
    );
}
