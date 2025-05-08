import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  People as PeopleIcon, 
  DirectionsCar as LicenseIcon,
  Description as ApplicationIcon,
  Assignment as TransactionIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Dummy data for demonstration
const recentActivities = [
  { id: 1, action: 'License issued', user: 'John Doe', time: '2 hours ago' },
  { id: 2, action: 'Application submitted', user: 'Jane Smith', time: '3 hours ago' },
  { id: 3, action: 'Citizen registered', user: 'Mike Johnson', time: '5 hours ago' },
  { id: 4, action: 'License renewed', user: 'Sarah Brown', time: '6 hours ago' },
];

const pendingTasks = [
  { id: 1, task: 'Review license application #12345', priority: 'High' },
  { id: 2, task: 'Verify citizen information for ID 67890', priority: 'Medium' },
  { id: 3, task: 'Process license renewal for Sarah Brown', priority: 'Low' },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome, {user?.full_name || 'User'}
      </Typography>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#e3f2fd' 
            }}
          >
            <PeopleIcon sx={{ fontSize: 40, mr: 2, color: '#1976d2' }} />
            <Box>
              <Typography variant="h5" component="div">
                253
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Citizens Registered
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#e8f5e9'
            }}
          >
            <LicenseIcon sx={{ fontSize: 40, mr: 2, color: '#4caf50' }} />
            <Box>
              <Typography variant="h5" component="div">
                128
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Licenses Issued
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#fff8e1'
            }}
          >
            <ApplicationIcon sx={{ fontSize: 40, mr: 2, color: '#ff9800' }} />
            <Box>
              <Typography variant="h5" component="div">
                42
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Applications
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#f3e5f5'
            }}
          >
            <TransactionIcon sx={{ fontSize: 40, mr: 2, color: '#9c27b0' }} />
            <Box>
              <Typography variant="h5" component="div">
                87
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transactions Today
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities and Tasks */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader title="Recent Activities" />
            <Divider />
            <CardContent>
              <List>
                {recentActivities.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemText
                        primary={activity.action}
                        secondary={`${activity.user} - ${activity.time}`}
                      />
                    </ListItem>
                    {activity.id !== recentActivities.length && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader title="Pending Tasks" />
            <Divider />
            <CardContent>
              <List>
                {pendingTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemText
                        primary={task.task}
                        secondary={`Priority: ${task.priority}`}
                      />
                    </ListItem>
                    {task.id !== pendingTasks.length && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 