import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Switch,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { useEffect } from 'react';
import useStore from '../../store/useStore';
import { FirebaseService } from '../../services/firebaseService';

const ProfileScreen = ({ onLogout, onNavPress, onSave }) => {
    const { profile, logout } = useStore();
    const [loading, setLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(false);

    // Form states
    const [fullName, setFullName] = useState(profile?.fullName || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [department, setDepartment] = useState(profile?.department || '');
    const role = profile?.role || 'Reporter';

    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName || '');
            setEmail(profile.email || '');
            setDepartment(profile.department || '');
        }
    }, [profile]);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            onLogout();
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 48 }} />
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                )}
                {/* Profile Header section */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            <MaterialIcons
                                name={role === 'Reviewer' ? 'admin-panel-settings' : role === 'Responder' ? 'support-agent' : 'person'}
                                size={64}
                                color={theme.colors.textSecondary}
                            />
                        </View>
                    </View>
                    <Text style={styles.userName}>{fullName || 'Loading...'}</Text>
                    <View style={styles.roleRow}>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.subRoleText}>Field Reporter</Text>
                    </View>
                </View>

                {/* Personal Information section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.card}>
                        <InfoField
                            icon="person"
                            label="FULL NAME"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                        <View style={styles.cardDivider} />
                        <InfoField
                            icon="mail"
                            label="EMAIL ADDRESS"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                        <View style={styles.cardDivider} />
                        <InfoField
                            icon="work"
                            label="DEPARTMENT"
                            value={department}
                            onChangeText={setDepartment}
                        />
                    </View>
                </View>

                {/* Settings section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <View style={styles.card}>
                        <SettingsLink icon="history" label="Incident History" onPress={() => onNavPress('incident-history')} />
                        <View style={styles.cardDivider} />
                        <SettingsLink icon="lock" label="Change Password" />
                        <View style={styles.cardDivider} />
                        <SettingsToggle
                            icon="notifications"
                            label="Push Notifications"
                            subLabel="For incident updates"
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                        />
                        <View style={styles.cardDivider} />
                        <SettingsToggle
                            icon="mail-outline"
                            label="Email Alerts"
                            subLabel="Weekly summaries"
                            value={emailAlerts}
                            onValueChange={setEmailAlerts}
                        />
                    </View>
                </View>

                {/* Help section */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <SettingsLink icon="help" label="Help & Support" />
                    </View>
                </View>

                {/* Logout button */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={20} color="#f87171" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutBtnText}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>App Version 2.1.0 (Build 342)</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                {role === 'Reviewer' ? (
                    <>
                        <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                        <NavButton icon="warning" label="Incidents" onPress={() => onNavPress('incoming-incidents')} />
                        <NavButton icon="assignment" label="Assign" onPress={() => { }} />
                        <NavButton icon="analytics" label="Reports" onPress={() => onNavPress('reports')} />
                    </>
                ) : role === 'Responder' ? (
                    <>
                        <NavButton icon="assignment-ind" label="Assigned" onPress={() => onNavPress('responder-dashboard')} />
                        <NavButton icon="person" label="Profile" active onPress={() => onNavPress('profile')} />
                    </>
                ) : (
                    <>
                        <NavButton icon="home" label="Home" onPress={() => onNavPress('home')} />
                        <NavButton icon="assignment" label="Incidents" onPress={() => onNavPress('my-incidents')} />
                        <NavButton icon="notifications" label="Notifs" onPress={() => onNavPress('notifications')} />
                        <NavButton icon="person" label="Profile" active onPress={() => onNavPress('profile')} />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const InfoField = ({ icon, label, value, onChangeText, keyboardType }) => (
    <View style={styles.infoField}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
            <MaterialIcons name={icon} size={20} color={theme.colors.textMuted} style={styles.fieldIcon} />
            <TextInput
                style={styles.fieldInput}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                placeholderTextColor={theme.colors.textMuted}
            />
        </View>
    </View>
);

const SettingsLink = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
        <View style={styles.settingsLeft}>
            <View style={styles.settingsIconWrapper}>
                <MaterialIcons name={icon} size={20} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>{label}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
    </TouchableOpacity>
);

const SettingsToggle = ({ icon, label, subLabel, value, onValueChange }) => (
    <View style={styles.settingsItem}>
        <View style={styles.settingsLeft}>
            <View style={styles.settingsIconWrapper}>
                <MaterialIcons name={icon} size={20} color={theme.colors.textMuted} />
            </View>
            <View>
                <Text style={styles.settingsLabel}>{label}</Text>
                <Text style={styles.settingsSubLabel}>{subLabel}</Text>
            </View>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#374151', true: theme.colors.primary }}
            thumbColor="#fff"
            ios_backgroundColor="#374151"
        />
    </View>
);

const NavButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navBtn} onPress={onPress}>
        {active && <View style={styles.activeDot} />}
        <MaterialIcons
            name={icon}
            size={26}
            color={active ? theme.colors.primary : theme.colors.textMuted}
        />
        <Text style={[
            styles.navLabel,
            { color: active ? theme.colors.primary : theme.colors.textMuted, fontWeight: active ? 'bold' : '500' }
        ]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    saveBtn: {
        paddingHorizontal: 12,
        height: 40,
        justifyContent: 'center',
    },
    saveBtnText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarWrapper: {
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 4,
        borderColor: theme.colors.surface,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: theme.colors.background,
    },
    userName: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roleBadge: {
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleBadgeText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subRoleText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    section: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: 24,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    infoField: {
        padding: 16,
    },
    fieldLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        height: 48,
        paddingHorizontal: 12,
    },
    fieldIcon: {
        marginRight: 12,
    },
    fieldInput: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 16,
        height: '100%',
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginHorizontal: 16,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsLabel: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    settingsSubLabel: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.3)',
        marginTop: 16,
    },
    logoutBtnText: {
        color: '#f87171',
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 24,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        height: 84,
        backgroundColor: '#0c1a11',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 20,
    },
    navBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
    },
    navLabel: {
        fontSize: 10,
        marginTop: 4,
    },
    activeDot: {
        position: 'absolute',
        top: 0,
        width: 32,
        height: 2,
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 34, 22, 0.5)',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
});

export default ProfileScreen;

