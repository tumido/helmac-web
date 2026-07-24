import {
    Box,
    TextField,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Radio,
    Typography,
    Chip,
} from "@mui/material";
import type { V2PricingDef } from "@/lib/services/v2";
import type { FieldMeta } from "./types";

export interface FieldRendererProps {
    field: FieldMeta;
    value: string;
    quantities?: Record<string, number>;
    multiSelected?: string[];
    pricingDef?: V2PricingDef;
    onChange: (value: string) => void;
    onQuantityChange?: (
        optionId: string,
        qty: number,
    ) => void;
    onMultiSelectChange?: (
        selected: string[],
    ) => void;
    disabled: boolean;
}

export function FieldRenderer({
    field,
    value,
    quantities,
    multiSelected,
    pricingDef,
    onChange,
    onQuantityChange,
    onMultiSelectChange,
    disabled,
}: FieldRendererProps) {
    const label = field.isActive ? (
        field.label
    ) : (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
            }}
        >
            {field.label}
            <Chip
                label="Zrušené pole"
                size="small"
                variant="outlined"
                color="default"
                sx={{ height: 20, fontSize: "0.7rem" }}
            />
        </Box>
    );

    switch (field.type) {
        case "checkbox":
            return (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={value === "true"}
                            onChange={(e) =>
                                onChange(
                                    String(
                                        e.target.checked,
                                    ),
                                )
                            }
                            disabled={disabled}
                        />
                    }
                    label={label}
                />
            );

        case "select":
            return (
                <FormControl fullWidth size="small">
                    <InputLabel>{label}</InputLabel>
                    <Select
                        value={value}
                        onChange={(e) =>
                            onChange(
                                e.target.value as string,
                            )
                        }
                        label={field.label}
                        disabled={disabled}
                    >
                        {field.options.map((opt) => (
                            <MenuItem
                                key={opt}
                                value={opt}
                            >
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );

        case "radio":
        case "pricing_select": {
            const options =
                field.type === "pricing_select"
                    ? (pricingDef?.options ?? []).map(
                          (o) => ({
                              id: o.id,
                              label: o.name,
                          }),
                      )
                    : field.options.map((o) => ({
                          id: o,
                          label: o,
                      }));
            const cols = Math.min(options.length, 3);
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: `repeat(${cols}, 1fr)`,
                            },
                            gap: 1,
                        }}
                    >
                        {options.map((opt) => {
                            const isSelected =
                                value === opt.id;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() =>
                                        !disabled &&
                                        onChange(opt.id)
                                    }
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        gap: 1,
                                        px: 2,
                                        py: 1.5,
                                        border: "2px solid",
                                        borderColor:
                                            isSelected
                                                ? "primary.main"
                                                : "divider",
                                        borderRadius: 1,
                                        cursor: disabled
                                            ? "default"
                                            : "pointer",
                                        opacity: disabled
                                            ? 0.6
                                            : 1,
                                        transition:
                                            "all 0.2s ease",
                                        "&:hover":
                                            disabled
                                                ? {}
                                                : {
                                                      borderColor:
                                                          isSelected
                                                              ? "primary.main"
                                                              : "action.selected",
                                                  },
                                    }}
                                >
                                    <Radio
                                        size="small"
                                        checked={
                                            isSelected
                                        }
                                        disabled={
                                            disabled
                                        }
                                        sx={{ p: 0 }}
                                        tabIndex={-1}
                                    />
                                    <Typography
                                        variant="body1"
                                        fontWeight={
                                            isSelected
                                                ? 600
                                                : 400
                                        }
                                    >
                                        {opt.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "pricing_quantity": {
            const options = pricingDef?.options ?? [];
            const cols = Math.min(options.length, 3);
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: `repeat(${cols}, 1fr)`,
                            },
                            gap: 1,
                        }}
                    >
                        {options.map((opt) => {
                            const qty =
                                quantities?.[opt.id] ?? 0;
                            return (
                                <Box
                                    key={opt.id}
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "space-between",
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        border: "2px solid",
                                        borderColor:
                                            qty > 0
                                                ? "primary.main"
                                                : "divider",
                                        borderRadius: 1,
                                        opacity: disabled
                                            ? 0.6
                                            : 1,
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        fontWeight={
                                            qty > 0
                                                ? 600
                                                : 400
                                        }
                                    >
                                        {opt.name}
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={String(
                                            qty,
                                        )}
                                        onChange={(e) => {
                                            const n =
                                                Math.max(
                                                    0,
                                                    Math.floor(
                                                        Number(
                                                            e
                                                                .target
                                                                .value,
                                                        ) ||
                                                            0,
                                                    ),
                                                );
                                            onQuantityChange?.(
                                                opt.id,
                                                n,
                                            );
                                        }}
                                        size="small"
                                        inputProps={{
                                            min: 0,
                                            step: 1,
                                        }}
                                        disabled={
                                            disabled
                                        }
                                        sx={{
                                            width: 80,
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "pricing_multi_select": {
            const msOptions =
                pricingDef?.options ?? [];
            const cols = Math.min(msOptions.length, 3);
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: `repeat(${cols}, 1fr)`,
                            },
                            gap: 1,
                        }}
                    >
                        {msOptions.map((opt) => {
                            const isSelected =
                                multiSelected?.includes(
                                    opt.id,
                                ) ?? false;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() => {
                                        if (disabled)
                                            return;
                                        const next =
                                            isSelected
                                                ? (
                                                      multiSelected ??
                                                      []
                                                  ).filter(
                                                      (
                                                          s,
                                                      ) =>
                                                          s !==
                                                          opt.id,
                                                  )
                                                : [
                                                      ...(multiSelected ??
                                                          []),
                                                      opt.id,
                                                  ];
                                        onMultiSelectChange?.(
                                            next,
                                        );
                                    }}
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        gap: 1,
                                        px: 2,
                                        py: 1.5,
                                        border: "2px solid",
                                        borderColor:
                                            isSelected
                                                ? "primary.main"
                                                : "divider",
                                        borderRadius: 1,
                                        cursor: disabled
                                            ? "default"
                                            : "pointer",
                                        opacity: disabled
                                            ? 0.6
                                            : 1,
                                        transition:
                                            "all 0.2s ease",
                                        "&:hover":
                                            disabled
                                                ? {}
                                                : {
                                                      borderColor:
                                                          isSelected
                                                              ? "primary.main"
                                                              : "action.selected",
                                                  },
                                    }}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={
                                            isSelected
                                        }
                                        disabled={
                                            disabled
                                        }
                                        sx={{ p: 0 }}
                                        tabIndex={-1}
                                    />
                                    <Typography
                                        variant="body1"
                                        fontWeight={
                                            isSelected
                                                ? 600
                                                : 400
                                        }
                                    >
                                        {opt.name}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "textarea":
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    disabled={disabled}
                />
            );

        default:
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    type={
                        field.type === "email"
                            ? "email"
                            : field.type === "number"
                              ? "number"
                              : field.type === "date" ||
                                  field.type ===
                                      "birth_date"
                                ? "date"
                                : "text"
                    }
                    fullWidth
                    size="small"
                    InputLabelProps={
                        field.type === "date" ||
                        field.type === "birth_date"
                            ? { shrink: true }
                            : undefined
                    }
                    disabled={disabled}
                />
            );
    }
}
