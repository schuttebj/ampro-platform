import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  FormHelperText,
  Divider
} from '@mui/material';

interface ApplicationFormData {
  citizen_id: number;
  applied_category: string;
  application_type: string;
  transaction_type: string;
  // Section A
  photograph_attached: boolean;
  photograph_count: number;
  // Section B
  previous_license_refusal: boolean;
  refusal_details?: string;
  // Section C
  card_notice_status?: string;
  police_report_station?: string;
  police_report_cas_number?: string;
  office_of_issue?: string;
  card_status_change_date?: string;
  // Section D - Legal declarations
  not_disqualified: boolean;
  not_suspended: boolean;
  not_cancelled: boolean;
  // Medical declarations
  no_uncontrolled_epilepsy: boolean;
  no_sudden_fainting: boolean;
  no_mental_illness: boolean;
  no_muscular_incoordination: boolean;
  no_uncontrolled_diabetes: boolean;
  no_defective_vision: boolean;
  no_unsafe_disability: boolean;
  no_narcotic_addiction: boolean;
  no_alcohol_addiction: boolean;
  medically_fit: boolean;
  // Declaration completion
  information_true_correct: boolean;
  applicant_signature_date?: string;
}

interface SectionProps {
  control: Control<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  watch?: any;
}

// License categories with age requirements
const licenseCategories = [
  { value: 'A1', label: 'A1 - Motorcycle ≤125cm³ (16 years minimum)', ageMin: 16 },
  { value: 'A', label: 'A - Motorcycle >125cm³ (18 years minimum)', ageMin: 18 },
  { value: 'B', label: 'B - Light motor vehicle ≤3,500 kg (18 years minimum)', ageMin: 18 },
  { value: 'C1', label: 'C1 - Heavy motor vehicle >3,500 kg and ≤16,000 kg (18 years minimum)', ageMin: 18 },
  { value: 'C', label: 'C - Extra heavy motor vehicle >16,000 kg (18 years minimum)', ageMin: 18 },
  { value: 'EB', label: 'EB - Light articulated vehicle', ageMin: 18 },
  { value: 'EC1', label: 'EC1 - Heavy articulated vehicle', ageMin: 18 },
  { value: 'EC', label: 'EC - Extra heavy articulated vehicle', ageMin: 18 }
];

// Section B: Class of Motor Vehicle
export const SectionB: React.FC<SectionProps> = ({ control, errors, watch }) => {
  const watchPreviousRefusal = watch('previous_license_refusal');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Section B: Class of Motor Vehicle and Previous License History
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="applied_category"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.applied_category}>
                <InputLabel>License Category *</InputLabel>
                <Select {...field} label="License Category *">
                  {licenseCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.applied_category && (
                  <FormHelperText>{errors.applied_category.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Previous License Refusal
          </Typography>
          <Controller
            name="previous_license_refusal"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  Have you ever been refused a driving license?
                </FormLabel>
                <RadioGroup
                  row
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value === 'true')}
                >
                  <FormControlLabel value={false} control={<Radio />} label="No" />
                  <FormControlLabel value={true} control={<Radio />} label="Yes" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        {watchPreviousRefusal && (
          <Grid item xs={12}>
            <Controller
              name="refusal_details"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Details of Previous Refusal"
                  placeholder="Please provide details about the previous license refusal..."
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// Section C: Notice of Card Status
export const SectionC: React.FC<SectionProps> = ({ control, errors, watch }) => {
  const watchCardStatus = watch('card_notice_status');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Section C: Notice of Card Status
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="card_notice_status"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Card Status</InputLabel>
                <Select {...field} label="Card Status">
                  <MenuItem value="theft">Card was stolen</MenuItem>
                  <MenuItem value="loss">Card was lost</MenuItem>
                  <MenuItem value="destruction">Card was destroyed</MenuItem>
                  <MenuItem value="recovery">Card was recovered</MenuItem>
                  <MenuItem value="new_card">Apply for new card</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {(watchCardStatus === 'theft' || watchCardStatus === 'loss') && (
          <>
            <Grid item xs={12} md={6}>
              <Controller
                name="police_report_station"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Police Station"
                    placeholder="Name of police station where reported"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="police_report_cas_number"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CAS Number"
                    placeholder="Police case number"
                  />
                )}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} md={6}>
          <Controller
            name="office_of_issue"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Office of Issue"
                placeholder="Office where license was originally issued"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="card_status_change_date"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label="Date of Status Change"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Section D: Declaration by Applicant
export const SectionD: React.FC<SectionProps> = ({ control, errors }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Section D: Declaration by Applicant
      </Typography>
      
      <Grid container spacing={3}>
        {/* Legal Declarations */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Legal Status Declaration
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Controller
              name="not_disqualified"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="I am not disqualified from holding a driving license"
                />
              )}
            />
            <Controller
              name="not_suspended"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="My driving license has not been suspended"
                />
              )}
            />
            <Controller
              name="not_cancelled"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="My driving license has not been cancelled"
                />
              )}
            />
          </Box>
        </Grid>

        {/* Medical Declarations */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Medical Declaration
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please confirm that you do not suffer from any of the following conditions:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Controller
              name="no_uncontrolled_epilepsy"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Uncontrolled epilepsy"
                />
              )}
            />
            <Controller
              name="no_sudden_fainting"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Sudden attacks of fainting or giddiness"
                />
              )}
            />
            <Controller
              name="no_mental_illness"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Mental illness that may affect driving ability"
                />
              )}
            />
            <Controller
              name="no_muscular_incoordination"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Muscular incoordination affecting limbs"
                />
              )}
            />
            <Controller
              name="no_uncontrolled_diabetes"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Uncontrolled diabetes mellitus"
                />
              )}
            />
            <Controller
              name="no_defective_vision"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Defective vision that cannot be corrected"
                />
              )}
            />
            <Controller
              name="no_unsafe_disability"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Any disability that would make driving unsafe"
                />
              )}
            />
            <Controller
              name="no_narcotic_addiction"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Addiction to narcotic drugs"
                />
              )}
            />
            <Controller
              name="no_alcohol_addiction"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Addiction to alcohol"
                />
              )}
            />
          </Box>
        </Grid>

        {/* Fitness Declaration */}
        <Grid item xs={12}>
          <Controller
            name="medically_fit"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} />}
                label="I declare that I am medically fit to drive a motor vehicle"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          />
        </Grid>

        {/* Final Declaration */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Controller
              name="information_true_correct"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="I declare that the information provided is true and correct to the best of my knowledge"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            />
            {errors.information_true_correct && (
              <Typography color="error" variant="body2">
                {errors.information_true_correct.message}
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Signature Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Applicant Signature
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box 
                sx={{ 
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 3,
                  minHeight: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.50',
                  position: 'relative'
                }}
              >
                <Typography variant="body2" color="textSecondary" align="center">
                  Signature Pad Placeholder
                  <br />
                  <small>(Digital signature pad will be implemented here)</small>
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="applicant_signature_date"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Signature Date"
                    type="date"
                    value={field.value || new Date().toISOString().split('T')[0]}
                    InputLabelProps={{ shrink: true }}
                    helperText="Date of signing this declaration"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}; 