import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Input from '@material-ui/core/Input';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import FilledInput from '@material-ui/core/FilledInput';
import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormGroup from '@material-ui/core/FormGroup';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Previous from '../fractions/NextButton'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
    width: "80%",
    margin: "auto",
  },
  margin: {
    margin: theme.spacing(1),
  },
  textField: {
    flexBasis: 100,
    flexGrow: 1,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "row",
    flexBasis: 150,
  },
  formControl: {
    flexGrow: 3,
    margin: "5px",
  },
  outputFormControl: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: '100px',
  },
  progress: {
    margin: '5px',
  },
  title: {
    margin: '8px',
    color: '#616161',
  },
  directions: {
    width: '100%',
  },
  nextButton: {
    float: 'right',
  },
  prevButton: {
    float: 'left',
  },
}));

export default function OutlinedInputAdornments(props) {
  const classes = useStyles();
  const {
    outLayerName,
    outLayerNameChange,
    validateOutLayerName,
    onApply,
    error,
    loading,
    previous,
  } = props
  const onPublish = () => {
    if(validateOutLayerName()){
      onApply()
    }
  }
  return (
    <div className={classes.root}>
      <Typography variant="subtitle1" className={classes.title}>Set Out Layer Name:
        {
          loading &&
          <CircularProgress className={classes.progress} size={15} />
        }
      </Typography>

      <FormControl className={classes.outputFormControl}>
        <TextField
          error={error}
          className={clsx(classes.margin, classes.textField)}
          variant="outlined"
          label="Output Layer Name"
          value={outLayerName || ''}
          onChange={outLayerNameChange}
          InputProps={{
            startAdornment: <InputAdornment position="start"> </InputAdornment>,
            name: 'outLayerName',
            placeholder: 'Output Layer Name'
          }}
          helperText="Please Enter an Alphanumeric Ex: table_name_1, Max length: 63 character"
        />

      </FormControl>

      <div className={classes.directions}>
      <Button className={classes.nextButton}
      color={'primary'} 
      onClick={onPublish} size={"large"} disabled={loading}>
          Publish
        </Button>
        <Previous
          next={false}
          className={classes.prevButton}
          onClick={previous}
        />
      </div>
    </div>
  );
}
