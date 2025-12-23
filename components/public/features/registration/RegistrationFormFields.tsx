"use client";

import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    FormHelperText,
    Typography,
    Box,
    Divider,
} from "@mui/material";
import Link from "next/link";
import {
    experienceLevelLabels,
    foodPreferenceLabels,
} from "@/lib/validators/registration";
import { RegistrationFormData } from "./registration.types";

interface RegistrationFormFieldsProps {
    formData: RegistrationFormData;
    onChange: (
        field: keyof RegistrationFormData
    ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSelectChange: (
        field: keyof RegistrationFormData
    ) => (event: { target: { value: string } }) => void;
    onCheckboxChange: (
        field: keyof RegistrationFormData
    ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
    getError: (field: string) => string | undefined;
}

export function RegistrationFormFields({
    formData,
    onChange,
    onSelectChange,
    onCheckboxChange,
    getError,
}: RegistrationFormFieldsProps) {
    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                Osobni udaje
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="firstName"
                        label="Jmeno"
                        value={formData.firstName}
                        onChange={onChange("firstName")}
                        error={!!getError("firstName")}
                        helperText={getError("firstName")}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="lastName"
                        label="Prijmeni"
                        value={formData.lastName}
                        onChange={onChange("lastName")}
                        error={!!getError("lastName")}
                        helperText={getError("lastName")}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="nickname"
                        label="Prezdivka"
                        value={formData.nickname}
                        onChange={onChange("nickname")}
                        error={!!getError("nickname")}
                        helperText={getError("nickname")}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={onChange("email")}
                        error={!!getError("email")}
                        helperText={getError("email")}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="phone"
                        label="Telefon"
                        value={formData.phone}
                        onChange={onChange("phone")}
                        error={!!getError("phone")}
                        helperText={getError("phone")}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="birthDate"
                        label="Datum narozeni"
                        type="date"
                        value={formData.birthDate}
                        onChange={onChange("birthDate")}
                        error={!!getError("birthDate")}
                        helperText={getError("birthDate")}
                        fullWidth
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
                LARP zkusenosti
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <FormControl fullWidth error={!!getError("experience")}>
                        <InputLabel>Uroven zkusenosti *</InputLabel>
                        <Select
                            name="experience"
                            value={formData.experience}
                            onChange={onSelectChange("experience")}
                            label="Uroven zkusenosti *"
                        >
                            {Object.entries(experienceLevelLabels).map(
                                ([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                )
                            )}
                        </Select>
                        {getError("experience") && (
                            <FormHelperText>
                                {getError("experience")}
                            </FormHelperText>
                        )}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="faction"
                        label="Preferovana frakce"
                        value={formData.faction}
                        onChange={onChange("faction")}
                        error={!!getError("faction")}
                        helperText={getError("faction")}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="character"
                        label="Kratky popis postavy"
                        value={formData.character}
                        onChange={onChange("character")}
                        error={!!getError("character")}
                        helperText={
                            getError("character") ||
                            "Nepovinne - muzete popsat svou postavu a pozadi"
                        }
                        fullWidth
                        multiline
                        rows={4}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
                Stravovani
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!getError("foodPreference")}>
                        <InputLabel>Stravovaci preference *</InputLabel>
                        <Select
                            name="foodPreference"
                            value={formData.foodPreference}
                            onChange={onSelectChange("foodPreference")}
                            label="Stravovaci preference *"
                        >
                            {Object.entries(foodPreferenceLabels).map(
                                ([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                )
                            )}
                        </Select>
                        {getError("foodPreference") && (
                            <FormHelperText>
                                {getError("foodPreference")}
                            </FormHelperText>
                        )}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="allergies"
                        label="Alergie"
                        value={formData.allergies}
                        onChange={onChange("allergies")}
                        error={!!getError("allergies")}
                        helperText={getError("allergies")}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="notes"
                        label="Dalsi poznamky"
                        value={formData.notes}
                        onChange={onChange("notes")}
                        error={!!getError("notes")}
                        helperText={getError("notes")}
                        fullWidth
                        multiline
                        rows={3}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
                Souhlasy
            </Typography>

            <Box sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="gdprConsent"
                            checked={formData.gdprConsent}
                            onChange={onCheckboxChange("gdprConsent")}
                        />
                    }
                    label="Souhlasim se zpracovanim osobnich udaju *"
                />
                <input
                    type="hidden"
                    name="gdprConsent"
                    value={formData.gdprConsent.toString()}
                />
                {getError("gdprConsent") && (
                    <FormHelperText error>
                        {getError("gdprConsent")}
                    </FormHelperText>
                )}
            </Box>

            <Box>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="rulesConsent"
                            checked={formData.rulesConsent}
                            onChange={onCheckboxChange("rulesConsent")}
                        />
                    }
                    label={
                        <>
                            Prectla/a jsem si a souhlasim s{" "}
                            <Link
                                href="/pravidla"
                                target="_blank"
                                style={{ color: "inherit" }}
                            >
                                pravidly akce
                            </Link>{" "}
                            *
                        </>
                    }
                />
                <input
                    type="hidden"
                    name="rulesConsent"
                    value={formData.rulesConsent.toString()}
                />
                {getError("rulesConsent") && (
                    <FormHelperText error>
                        {getError("rulesConsent")}
                    </FormHelperText>
                )}
            </Box>
        </>
    );
}
