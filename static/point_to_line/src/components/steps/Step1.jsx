import React, { useState } from 'react';
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
import Next from '../fractions/NextButton'
import Previous from '../fractions/NextButton'
import Avatar from '@material-ui/core/Avatar';
import LayerIcon from '@material-ui/icons/Layers';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Adjust from '@material-ui/icons/Adjust';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
    width: "80%",
    margin: "auto",
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
  selectedLayerArea: {
    minHeight: 'max-content',
  },
  selectItem: {
    display: "flex",
    flexDirection: 'row',
    margin: '15px 0',
    alignItems: 'center',
    minHeight: 'max-content',
  },
  layerDetails: {
    display: 'flex',
    flexDirection: 'column',
    margin: '5px 20px',
  },
  selectAllContent: {
    minHeight: 'max-content',
  },
  selectedLayer: {
    border: "1px solid lightgrey",
    borderRadius: '5px',
    padding: '5px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: "center",
    marginBottom: '10px',
    padding: "5px 10px",
  },
  checkBoxes: {
    height: '300px',
    overflow: 'auto',
    border: '2px dashed lightgrey',
    paddingLeft: '10px',
    marginBottom: '20px',
  },
  checkBoxesError: {
    height: '300px',
    overflow: 'auto',
    border: '2px dashed red',
    paddingLeft: '10px',
    marginBottom: '20px',
  },
  checkAllCheckBox: {
    marginLeft: '10px',
  }
}));

const LayersSelectComponent = (props) => {
  const classes = useStyles()
  const { outLayers, onChange, groupByValue } = props
  return (
    outLayers.map((layer, index) => (
      <div key={index} className={classes.selectItem}>
        <FormControlLabel
          control={
            <Checkbox onChange={onChange} value={layer.name} checked={layer.checked} disabled={layer.numberOfFeatures < 2} />
          }
        />
        <Adjust />
        <div className={classes.layerDetails}>
          <Typography>
            {groupByValue}: {layer.name}
          </Typography>
          <Typography variant={'subtitle2'} color={layer.numberOfFeatures > 1 ? 'textSecondary' : 'error'}>
            Point features count: {layer.numberOfFeatures}
          </Typography>
          <div className={classes.duplicateFeatures}>
            {
              layer.duplicated_features.length > 0 &&
              <Typography variant={'subtitle1'}>
                Duplicated Features Found:
              </Typography>
            }
            {layer.duplicated_features.map((f, index) => (
              <Typography key={index} variant={'subtitle2'} color={'error'}>
                {f}
              </Typography>
            ))}
          </div>
        </div>
      </div>
    ))
  )
}
export default function OutlinedInputAdornments(props) {
  const classes = useStyles();
  const {
    inLayer,
    next,
    previous,
    onCheckAll,
    onCheck,
    groupByValue,
    outLayers,
    loading,
  } = props
  const [error, setError] = useState(false)
  const onNext = () => {
    const { outLayers } = props
    const selected = outLayers.filter(l => l.checked)
    if (selected.length > 0){
      setError(false)
      next()
    }
    else {
      setError(true)
    }
  }
  return (
    <div className={classes.root}>
      <Typography variant="subtitle1" className={classes.title}>Select Out Lines:
      {loading && <CircularProgress size={20} />}
      </Typography>

      <div className={classes.selectedLayer}>
        <Avatar className={classes.avatar}>
          <LayerIcon />
        </Avatar>
        <Typography className={classes.layerDetails}>
          Selected Point Layer: <strong>{inLayer && inLayer.name}</strong>
        </Typography>
      </div>

      <div className={classes.selectItem}>
        <FormControlLabel
          control={
            <Checkbox onChange={onCheckAll} className={classes.checkAllCheckBox} />
          }
        />
        <div className={classes.layerDetails}>
          <Typography>
            Select All
          </Typography>
          <Typography variant={'subtitle2'} color={'error'}>
            Warning: Only Lines with more than 1 point can be selected
          </Typography>
          <Typography variant={'subtitle2'} color={'error'}>
            Warning: The duplicated features will be ignored
          </Typography>
        </div>
      </div>

      <div className={error ? classes.checkBoxesError: classes.checkBoxes}>
        <LayersSelectComponent
          outLayers={outLayers}
          onChange={onCheck}
          groupByValue={groupByValue}
          error={error}
        />
      </div>

      <div className={classes.directions}>
        <Next
          next={true}
          className={classes.nextButton}
          onClick={onNext}
        />
        <Previous
          next={false}
          className={classes.prevButton}
          onClick={previous}
        />
      </div>
    </div>
  );
}
