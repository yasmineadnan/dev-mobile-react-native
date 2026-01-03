import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import useStore from '../../store/useStore';
import { FirebaseService } from '../../services/firebaseService';

const { width } = Dimensions.get('window');

const ReviewerDashboard = ({ onNavPress, onIncidentPress }) => {
    const { profile } = useStore();
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0
    });
    const [priorityStats, setPriorityStats] = useState({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    });
    const [needsAttention, setNeedsAttention] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time stats listener
        const q = query(collection(db, 'incidents'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0, pending = 0, inProgress = 0, resolved = 0;
            let critical = 0, high = 0, medium = 0, low = 0;
            const allIncidents = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                total++;
                if (data.status === 'Open') pending++;
                else if (data.status === 'In Progress') inProgress++;
                else if (data.status === 'Resolved') resolved++;

                if (data.priority === 'Critical') critical++;
                else if (data.priority === 'High') high++;
                else if (data.priority === 'Medium') medium++;
                else if (data.priority === 'Low') low++;

                allIncidents.push({ id: doc.id, ...data });
            });

            setStats({ total, pending, inProgress, resolved });

            // Calculate percentages for distribution
            const totalForDist = total || 1;
            setPriorityStats({
                critical: Math.round((critical / totalForDist) * 100),
                high: Math.round((high / totalForDist) * 100),
                medium: Math.round((medium / totalForDist) * 100),
                low: Math.round((low / totalForDist) * 100)
            });

            // "Needs Attention" - Critical and High priority pending items
            const attention = allIncidents
                .filter(i => i.status === 'Open' && (i.priority === 'Critical' || i.priority === 'High'))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .slice(0, 3);

            setNeedsAttention(attention);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={() => onNavPress('profile')}
                >
                    <MaterialIcons name="admin-panel-settings" size={28} color="#9dabb9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <TouchableOpacity style={styles.notiBtn}>
                    <MaterialIcons name="notifications" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>Hello, {profile?.fullName?.split(' ')[0] || 'Alex'}.</Text>
                    <Text style={styles.subGreeting}>You have {stats.pending} incidents pending review today.</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total"
                        value={stats.total}
                        icon="folder"
                        color="#3d4652"
                    />
                    <StatCard
                        title="Pending"
                        value={stats.pending}
                        icon="hourglass-empty"
                        color={theme.colors.primary}
                        highlight
                    />
                    <StatCard
                        title="In Progress"
                        value={stats.inProgress}
                        icon="sync"
                        color="#3d4652"
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.resolved}
                        icon="check-circle"
                        color="#3d4652"
                    />
                </View>

                {/* Priority Distribution */}
                <View style={styles.chartSection}>
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={styles.chartTitle}>Priority Distribution</Text>
                                <Text style={styles.chartSub}>Incidents by severity level</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>This Week</Text>
                            </View>
                        </View>

                        <View style={styles.chartBody}>
                            <ChartRow label="Critical" percent={priorityStats.critical} color="#ef4444" />
                            <ChartRow label="High" percent={priorityStats.high} color="#f59e0b" />
                            <ChartRow label="Medium" percent={priorityStats.medium} color={theme.colors.primary} />
                            <ChartRow label="Low" percent={priorityStats.low} color="#64748b" />
                        </View>
                    </View>
                </View>

                {/* Needs Attention */}
                <View style={styles.attentionSection}>
                    <View style={styles.attentionHeader}>
                        <Text style={styles.sectionTitle}>Needs Attention</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllBtn}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.attentionList}>
                        {needsAttention.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.attentionItem, { borderLeftColor: getPriorityColor(item.priority) }]}
                                onPress={() => onIncidentPress(item.id)}
                            >
                                <View>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemMeta}>#{item.id.substring(0, 4)} • {item.category}</Text>
                                </View>
                                <View style={styles.itemRight}>
                                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                                        <MaterialIcons name={getPriorityIcon(item.priority)} size={12} color={getPriorityColor(item.priority)} />
                                        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
                                    </View>
                                    <Text style={styles.itemStatus}>Pending Review</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Action */}
                <TouchableOpacity style={styles.quickActionBtn}>
                    <MaterialIcons name="add-circle" size={24} color="#fff" />
                    <Text style={styles.quickActionText}>Create New Report</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <NavButton icon="dashboard" label="Dashboard" active onPress={() => onNavPress('reviewer-dashboard')} />
                <NavButton icon="warning" label="Incidents" onPress={() => onNavPress('incoming-incidents')} />
                <NavButton icon="assignment" label="Assignments" onPress={() => onNavPress('assignments-list')} />
                <NavButton icon="analytics" label="Reports" onPress={() => onNavPress('reports')} />
            </View>
        </SafeAreaView>
    );
};

const StatCard = ({ title, value, icon, color, highlight }) => (
    <View style={[styles.statCard, highlight ? { backgroundColor: theme.colors.primary } : { backgroundColor: '#283039' }]}>
        <View style={styles.statTop}>
            <View style={[styles.statIconWrapper, highlight ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: '#3d4652' }]}>
                <MaterialIcons name={icon} size={20} color={highlight ? "#fff" : "#9dabb9"} />
            </View>
            <Text style={[styles.statLabel, highlight ? { color: 'rgba(255,255,255,0.9)' } : { color: '#9dabb9' }]}>{title}</Text>
        </View>
        <Text style={[styles.statValue, highlight ? { color: '#fff' } : { color: '#fff' }]}>{value}</Text>
        {highlight && <View style={styles.cardGlow} />}
    </View>
);

const ChartRow = ({ label, percent, color }) => (
    <View style={styles.chartRow}>
        <Text style={[styles.chartLabel, { color }]}>{label}</Text>
        <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.progressText}>{percent}%</Text>
        </View>
    </View>
);

const NavButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navBtn} onPress={onPress}>
        <MaterialIcons
            name={icon}
            size={24}
            color={active ? theme.colors.primary : '#9dabb9'}
            style={active && styles.activeIcon}
        />
        <Text style={[styles.navLabel, { color: active ? theme.colors.primary : '#9dabb9', fontWeight: active ? 'bold' : '500' }]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111418',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#111418',
    },
    profileContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#283039',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#283039',
    },
    profilePic: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    notiBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#283039',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 24,
    },
    greetingSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    greetingText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    subGreeting: {
        color: '#9dabb9',
        fontSize: 16,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 8,
    },
    statCard: {
        width: (width - 40) / 2,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'space-between',
        height: 110,
        overflow: 'hidden',
    },
    statTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    cardGlow: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    chartSection: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    chartCard: {
        backgroundColor: '#283039',
        borderRadius: 16,
        padding: 20,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    chartTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    chartSub: {
        color: '#9dabb9',
        fontSize: 14,
    },
    badge: {
        backgroundColor: '#3d4652',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#9dabb9',
        fontSize: 10,
        fontWeight: 'bold',
    },
    chartBody: {
        gap: 12,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chartLabel: {
        width: 60,
        fontSize: 13,
        fontWeight: 'bold',
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111418',
        height: 32,
        borderRadius: 8,
        paddingHorizontal: 4,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        color: '#9dabb9',
        fontSize: 10,
        marginLeft: 8,
        width: 30,
    },
    attentionSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    attentionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewAllBtn: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    attentionList: {
        gap: 12,
    },
    attentionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#283039',
        borderRadius: 16,
        borderLeftWidth: 4,
    },
    itemTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    itemMeta: {
        color: '#9dabb9',
        fontSize: 12,
        marginTop: 4,
    },
    itemRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    itemStatus: {
        color: '#9dabb9',
        fontSize: 12,
        marginTop: 4,
    },
    quickActionBtn: {
        marginHorizontal: 16,
        marginTop: 8,
        backgroundColor: '#3d4652',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    quickActionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(17, 20, 24, 0.95)',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#283039',
        paddingBottom: 20,
    },
    navBtn: {
        alignItems: 'center',
        gap: 4,
        minWidth: 64,
    },
    navLabel: {
        fontSize: 11,
    },
    activeIcon: {
        transform: [{ scale: 1.1 }],
    }
});

export default ReviewerDashboard;

