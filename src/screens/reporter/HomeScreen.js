import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { collection, query, orderBy, limit, onSnapshot, where, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

import useStore from '../../store/useStore';

const HomeScreen = ({ onReportPress, onNavPress }) => {
    const { profile } = useStore();
    const [stats, setStats] = useState({ pending: 0, active: 0, resolved: 0 });
    const [recentActivity, setRecentActivity] = useState([]);

    const userName = profile?.fullName?.split(' ')[0] || 'User';
    const userRole = profile?.role || 'Reporter';

    useEffect(() => {
        if (!auth.currentUser) return;

        // Stats Listener
        const qStats = query(collection(db, 'incidents'), where('reporterId', '==', auth.currentUser.uid));
        const unsubscribeStats = onSnapshot(qStats, (snapshot) => {
            const newStats = { pending: 0, active: 0, resolved: 0 };
            snapshot.forEach((doc) => {
                const status = doc.data().status;
                if (status === 'Open') newStats.pending++;
                else if (status === 'In Progress') newStats.active++;
                else if (status === 'Resolved') newStats.resolved++;
            });
            setStats(newStats);
        });

        // Recent Activity Listener
        const qActivity = query(
            collection(db, 'incidents'),
            where('reporterId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const unsubscribeActivity = onSnapshot(qActivity, (snapshot) => {
            const activities = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    ...data,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                    icon: getIconForCategory(data.category),
                    iconBg: 'rgba(255,255,255,0.05)',
                    iconColor: getColorForStatus(data.status),
                    statusColor: getColorForStatus(data.status),
                    priority: data.priority || 'Medium',
                });
            });
            setRecentActivity(activities);
        });

        return () => {
            unsubscribeStats();
            unsubscribeActivity();
        };
    }, []);

    const getIconForCategory = (category) => {
        switch (category) {
            case 'Safety': return 'warning';
            case 'Maintenance': return 'build';
            case 'Security': return 'security';
            case 'IT Issue': return 'computer';
            default: return 'info';
        }
    };

    const getColorForStatus = (status) => {
        switch (status) {
            case 'Open': return theme.colors.orange;
            case 'In Progress': return theme.colors.blue;
            case 'Resolved': return theme.colors.primary;
            default: return theme.colors.textMuted;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return '#ef4444';
            case 'High': return '#f59e0b';
            case 'Medium': return theme.colors.primary;
            case 'Low': return '#64748b';
            default: return theme.colors.textMuted;
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'Critical': return 'warning';
            case 'High': return 'priority-high';
            case 'Medium': return 'equalizer';
            case 'Low': return 'low-priority';
            default: return 'info';
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Top App Bar */}
            <View style={styles.appBar}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <MaterialIcons name="person" size={24} color={theme.colors.textSecondary} />
                    </View>
                    <View>
                        <Text style={styles.greeting}>Good Morning, {userName}</Text>
                        <Text style={styles.role}>{userRole}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.notificationBtn}
                    onPress={() => onNavPress('notifications')}
                >
                    <MaterialIcons name="notifications" size={24} color={theme.colors.text} />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Primary Action Card */}
                <View style={styles.reportCard}>
                    <View style={styles.reportCardContent}>
                        <View style={styles.reportIconBg}>
                            <MaterialIcons name="add-alert" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.reportTitle}>Report an Incident</Text>
                        <Text style={styles.reportSubtitle}>
                            Spot something? Submit a new safety or technical issue quickly.
                        </Text>
                        <TouchableOpacity
                            style={styles.startReportBtn}
                            onPress={onReportPress}
                        >
                            <MaterialIcons name="add" size={20} color={theme.colors.background} />
                            <Text style={styles.startReportText}>Start New Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Overview Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsRow}>
                        <StatCard label="PENDING" value={stats.pending.toString()} color={theme.colors.orange} />
                        <StatCard label="ACTIVE" value={stats.active.toString()} color={theme.colors.blue} />
                        <StatCard label="DONE" value={stats.resolved.toString()} color={theme.colors.primary} />
                    </View>
                </View>

                {/* Quick Report Chips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Report</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                        <QuickChip icon="health-and-safety" label="Safety" color={theme.colors.primary} />
                        <QuickChip icon="dns" label="IT Issue" color={theme.colors.blue} />
                        <QuickChip icon="history" label="History" color={theme.colors.textSecondary} onPress={() => onNavPress('incident-history')} />
                        <QuickChip icon="lock" label="Security" color={theme.colors.error} />
                    </ScrollView>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => onNavPress('my-incidents')}>
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <ActivityItem
                                key={activity.id}
                                icon={activity.icon}
                                title={activity.title}
                                time={activity.time}
                                status={activity.status}
                                statusColor={activity.statusColor}
                                iconBg={activity.iconBg}
                                iconColor={activity.iconColor}
                                priority={activity.priority}
                                priorityColor={getPriorityColor(activity.priority)}
                                priorityIcon={getPriorityIcon(activity.priority)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyActivity}>
                            <Text style={styles.emptyActivityText}>No recent activity</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation Placeholder */}
            <View style={styles.bottomNav}>
                <NavButton
                    icon="home"
                    label="Home"
                    active
                    onPress={() => onNavPress('home')}
                />
                <NavButton
                    icon="assignment"
                    label="My Incidents"
                    onPress={() => onNavPress('my-incidents')}
                />
                <NavButton
                    icon="notifications"
                    label="Notifs"
                    onPress={() => onNavPress('notifications')}
                />
                <NavButton
                    icon="person"
                    label="Profile"
                    onPress={() => onNavPress('profile')}
                />
            </View>
        </SafeAreaView>
    );
};

const StatCard = ({ label, value, color }) => (
    <View style={styles.statCard}>
        <View style={styles.statHeader}>
            <View style={[styles.statDot, { backgroundColor: color }]} />
            <Text style={styles.statLabel}>{label}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const QuickChip = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
        <MaterialIcons name={icon} size={20} color={color} />
        <Text style={styles.chipLabel}>{label}</Text>
    </TouchableOpacity>
);

const ActivityItem = ({ icon, title, time, status, statusColor, iconBg, iconColor, priority, priorityColor, priorityIcon }) => (
    <View style={styles.activityItem}>
        <View style={[styles.activityIconWrapper, { backgroundColor: iconBg }]}>
            <MaterialIcons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.activityInfo}>
            <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
            <View style={styles.activityMeta}>
                <Text style={styles.activityTime}>{time}</Text>
                <Text style={styles.metaDot}>•</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name={priorityIcon} size={12} color={priorityColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.priorityBrief, { color: priorityColor }]}>
                        {priority}
                    </Text>
                </View>
            </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
    </View>
);

const NavButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navBtn} onPress={onPress}>
        <MaterialIcons
            name={icon}
            size={26}
            color={active ? theme.colors.primary : theme.colors.textMuted}
        />
        <Text style={[
            styles.navLabel,
            { color: active ? theme.colors.primary : theme.colors.textMuted }
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
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    greeting: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    role: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    reportCard: {
        margin: theme.spacing.lg,
        borderRadius: theme.roundness.xl,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    reportCardContent: {
        padding: theme.spacing.xl,
        backgroundColor: 'rgba(28, 39, 31, 0.8)',
    },
    reportIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    reportTitle: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: theme.spacing.xs,
    },
    reportSubtitle: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: theme.spacing.lg,
        maxWidth: '85%',
        lineHeight: 20,
    },
    startReportBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: theme.roundness.md,
        gap: 8,
    },
    startReportText: {
        color: theme.colors.background,
        fontSize: 14,
        fontWeight: 'bold',
    },
    section: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: theme.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surfaceHighlight,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statLabel: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    statValue: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    chipsScroll: {
        flexDirection: 'row',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceHighlight,
        paddingLeft: 12,
        paddingRight: 16,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chipLabel: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    viewAll: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: theme.roundness.lg,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    activityIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityInfo: {
        flex: 1,
        marginLeft: 12,
    },
    activityTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    activityTime: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    metaDot: {
        color: theme.colors.textMuted,
        marginHorizontal: 4,
        fontSize: 10,
    },
    priorityBrief: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        height: 84,
        backgroundColor: 'rgba(16, 34, 22, 0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
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
        fontWeight: '500',
        marginTop: 4,
    },
    emptyActivity: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
    },
    emptyActivityText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
});

export default HomeScreen;


