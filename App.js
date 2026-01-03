import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/reporter/HomeScreen';
import MyIncidentsScreen from './src/screens/reporter/MyIncidentsScreen';
import NewIncidentScreen from './src/screens/reporter/NewIncidentScreen';
import IncidentDetailsScreen from './src/screens/reporter/IncidentDetailsScreen';
import IncidentHistoryScreen from './src/screens/reporter/IncidentHistoryScreen';
import ProfileScreen from './src/screens/reporter/ProfileScreen';
import NotificationsScreen from './src/screens/reporter/NotificationsScreen';
import ReviewerDashboard from './src/screens/reviewer/ReviewerDashboard';
import ResponderDashboard from './src/screens/responder/ResponderDashboard';
import ResponderIncidentDetailsScreen from './src/screens/responder/ResponderIncidentDetailsScreen';
import UpdateStatusScreen from './src/screens/responder/UpdateStatusScreen';
import IncomingIncidentsScreen from './src/screens/reviewer/IncomingIncidentsScreen';
import AssignResponderScreen from './src/screens/reviewer/AssignResponderScreen';
import ReviewerIncidentDetailsScreen from './src/screens/reviewer/ReviewerIncidentDetailsScreen';
import AssignmentsListScreen from './src/screens/reviewer/AssignmentsListScreen';
import IncidentMessagesScreen from './src/screens/IncidentMessagesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import UserManagementScreen from './src/screens/admin/UserManagementScreen';
import RolesPermissionsScreen from './src/screens/admin/RolesPermissionsScreen';
import CategoriesScreen from './src/screens/admin/CategoriesScreen';



import useStore from './src/store/useStore';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const { user, profile, loading, initializeAuth } = useStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (profile) {
        // Normal flow with profile
        const isEntryScreen = currentScreen === 'login' || currentScreen === 'register';

        if (isEntryScreen) {
          if (profile.role === 'Reviewer') {
            setCurrentScreen('reviewer-dashboard');
          } else if (profile.role === 'Responder') {
            setCurrentScreen('responder-dashboard');
          } else if (profile.role === 'Admin') {
            setCurrentScreen('admin-user-management');
          } else {
            setCurrentScreen('home');
          }
        } else if (profile.role === 'Reviewer' && currentScreen === 'home') {
          setCurrentScreen('reviewer-dashboard');
        } else if (profile.role === 'Responder' && (currentScreen === 'home' || currentScreen === 'reviewer-dashboard')) {
          setCurrentScreen('responder-dashboard');
        } else if (profile.role === 'Admin' && currentScreen !== 'admin-user-management' && currentScreen !== 'admin-roles-permissions' && currentScreen !== 'admin-categories') {
          setCurrentScreen('admin-user-management');
        } else if (profile.role !== 'Reviewer' && profile.role !== 'Responder' && profile.role !== 'Admin' && (currentScreen === 'reviewer-dashboard' || currentScreen === 'responder-dashboard' || currentScreen === 'admin-user-management')) {
          setCurrentScreen('home');

        }
      } else {
        // Authenticated but no profile (e.g., deleted document or incomplete registration)
        // We can redirect to profile or allow home but with limited features
        if (currentScreen === 'login' || currentScreen === 'register') {
          setCurrentScreen('profile'); // Send them to profile to fix it if possible
        }
      }
    } else if (!loading && !user) {
      if (currentScreen !== 'login' && currentScreen !== 'register') {
        setCurrentScreen('login');
      }
    }
  }, [user, loading, profile, currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onSignUp={() => setCurrentScreen('register')}
            onLoginSuccess={() => { }} // Rely on side-effect in useEffect
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onLogin={() => setCurrentScreen('login')}
          />
        );
      case 'home':
        return (
          <HomeScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
            onReportPress={() => setCurrentScreen('new-incident')}
          />
        );
      case 'my-incidents':
        return (
          <MyIncidentsScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
            onIncidentPress={(id) => {
              setSelectedIncidentId(id);
              setCurrentScreen('incident-details');
            }}
          />
        );
      case 'incoming-incidents':
        return (
          <IncomingIncidentsScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
            onIncidentPress={(id) => {
              setSelectedIncidentId(id);
              setCurrentScreen('incident-details');
            }}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'new-incident':
        return (
          <NewIncidentScreen
            onCancel={() => setCurrentScreen(profile?.role === 'Reviewer' ? 'reviewer-dashboard' : 'home')}
            onSubmit={() => setCurrentScreen('my-incidents')}
          />
        );
      case 'incident-history':
        return (
          <IncidentHistoryScreen
            onBack={() => setCurrentScreen(profile?.role === 'Reviewer' ? 'reviewer-dashboard' : 'home')}
            onNavPress={setCurrentScreen}
          />
        );
      case 'incident-details':
        if (profile?.role === 'Reviewer') {
          return (
            <ReviewerIncidentDetailsScreen
              incidentId={selectedIncidentId}
              onBack={() => setCurrentScreen('incoming-incidents')}
              onNavPress={(screen) => setCurrentScreen(screen)}
            />
          );
        } else if (profile?.role === 'Responder') {
          return (
            <ResponderIncidentDetailsScreen
              incidentId={selectedIncidentId}
              onBack={() => setCurrentScreen('responder-dashboard')}
              onNavPress={(screen) => setCurrentScreen(screen)}
            />
          );
        } else {
          return (
            <IncidentDetailsScreen
              incidentId={selectedIncidentId}
              onBack={() => setCurrentScreen('my-incidents')}
              onNavPress={(screen) => setCurrentScreen(screen)}
            />
          );
        }
      case 'profile':
        return (
          <ProfileScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
            onLogout={() => setCurrentScreen('login')}
            onSave={() => alert('Profile Saved!')}
          />
        );
      case 'reviewer-dashboard':
        return (
          <ReviewerDashboard
            onNavPress={(screen) => setCurrentScreen(screen)}
            onIncidentPress={(id) => {
              setSelectedIncidentId(id);
              setCurrentScreen('incident-details');
            }}
          />
        );
      case 'responder-dashboard':
        return (
          <ResponderDashboard
            onNavPress={(screen) => setCurrentScreen(screen)}
            onIncidentPress={(id) => {
              setSelectedIncidentId(id);
              setCurrentScreen('incident-details');
            }}
          />
        );
      case 'update-status':
        return (
          <UpdateStatusScreen
            incidentId={selectedIncidentId}
            onBack={() => setCurrentScreen('incident-details')}
            onSave={() => setCurrentScreen('incident-details')}
          />
        );
      case 'assign-responder':
        return (
          <AssignResponderScreen
            incidentId={selectedIncidentId}
            onBack={() => setCurrentScreen('incident-details')}
            onAssigned={() => {
              // Refresh incident details after assignment
              setCurrentScreen('incident-details');
            }}
          />
        );
      case 'assignments-list':
        return (
          <AssignmentsListScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
            onIncidentPress={(id) => {
              setSelectedIncidentId(id);
              setCurrentScreen('incident-details');
            }}
          />
        );
      case 'incident-messages':
        return (
          <IncidentMessagesScreen
            incidentId={selectedIncidentId}
            onBack={() => setCurrentScreen('incident-details')}
            onNavPress={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'admin-user-management':
        return (
          <UserManagementScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'admin-roles-permissions':
        return (
          <RolesPermissionsScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'admin-categories':
        return (
          <CategoriesScreen
            onNavPress={(screen) => setCurrentScreen(screen)}
          />
        );

      default:
        return (
          <LoginScreen
            onSignUp={() => setCurrentScreen('register')}
            onLoginSuccess={() => { }} // Rely on useEffect for navigation
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          renderScreen()
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102216',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#102216',
  },
});
