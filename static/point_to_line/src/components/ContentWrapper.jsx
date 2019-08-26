import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import PublishForm from './PublishForm'
import ResourceSelectDialog from './ResourceSelectDialog'
import ResultsDialog from './ResultsDialog'
import OutLayersDialog from './OutLayersDialog'
const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2),
    minHeight: 'calc(100vh - 200px)',
  },
}));
export default (props) => {
  const classes = useStyles();
  return (
    <div>
      <Paper className={classes.root}>
        <PublishForm {...props.publishForm}/>
        <ResourceSelectDialog {...props.resourceSelectProps}/>
        <ResultsDialog {...props.resultsDialog}/>
        <OutLayersDialog {...props.outLayersDialog}/>
      </Paper>
    </div>
  );
}
