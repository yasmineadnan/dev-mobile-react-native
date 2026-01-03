import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { auth } from '../../firebase/config';
import { FirebaseService } from '../../services/firebaseService';
import useStore from '../../store/useStore';

const ResponderDashboard = ({ onNavPress, onIncidentPress }) => {
    const { profile } = useStore();
    const [filter, setFilter] = useState('Active');
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = FirebaseService.subscribeToResponderAssignments(auth.currentUser.uid, (data) => {
            setAssignments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filterAssignments = () => {
        if (filter === 'Active') {
            return assignments.filter(a => a.status !== 'Resolved' && a.status !== 'Closed');
        }
        return assignments.filter(a => a.status === 'Resolved' || a.status === 'Closed');
    };

    const groupedAssignments = () => {
        const filtered = filterAssignments();
        const today = new Date().toLocaleDateString();

        const todayItems = [];
        const yesterdayItems = [];
        const earlierItems = [];

        filtered.forEach(item => {
            const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
            const dateString = date.toLocaleDateString();
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (dateString === today) {
                todayItems.push(item);
            } else if (diffDays <= 2) { // Roughly yesterday
                yesterdayItems.push(item);
            } else {
                earlierItems.push(item);
            }
        });

        return { todayItems, yesterdayItems, earlierItems };
    };

    const { todayItems, yesterdayItems, earlierItems } = groupedAssignments();

    // Stats
    const highPriorityCount = assignments.filter(a => a.priority === 'High' || a.priority === 'Critical').length;
    const pendingCount = assignments.filter(a => a.status === 'In Progress' || a.status === 'Assigned').length;

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const now = new Date();
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return '#ef4444';
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#13ec5b';
            default: return theme.colors.textMuted;
        }
    };

    // Helper to map icon based on category/title
    const getIconForIncident = (incident) => {
        const title = incident.title?.toLowerCase() || '';
        const category = incident.category?.toLowerCase() || '';

        if (title.includes('spill') || title.includes('chemical')) return 'science';
        if (category.includes('safety')) return 'warning';
        if (title.includes('server') || title.includes('technical')) return 'dns';
        if (title.includes('light') || title.includes('electric')) return 'lightbulb';
        if (title.includes('water') || title.includes('leak')) return 'water-drop';

        return 'assignment';
    };

    const AssignmentCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: getPriorityColor(item.priority) }]}
            onPress={() => onIncidentPress(item.id)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badges}>
                    <View style={[styles.badge, styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                            {item.priority?.toUpperCase() || 'NORMAL'}
                        </Text>
                    </View>
                    <View style={[styles.badge, styles.statusBadge]}>
                        <Text style={styles.badgeTextStatus}>
                            {item.status?.toUpperCase() || 'NEW'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={getIconForIncident(item)} size={24} color={theme.colors.textMuted} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {item.category} • {item.location || item.area || 'Unknown Location'}
                    </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Assignments</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MaterialIcons name="filter-list" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentContainer}>
                <View style={styles.segmentWrapper}>
                    <TouchableOpacity
                        style={[styles.segmentBtn, filter === 'Active' && styles.segmentBtnActive]}
                        onPress={() => setFilter('Active')}
                    >
                        <Text style={[styles.segmentText, filter === 'Active' && styles.segmentTextActive]}>Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentBtn, filter === 'Resolved' && styles.segmentBtnActive]}
                        onPress={() => setFilter('Resolved')}
                    >
                        <Text style={[styles.segmentText, filter === 'Resolved' && styles.segmentTextActive]}>Resolved</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <MaterialIcons name="priority-high" size={20} color="#ef4444" />
                        </View>
                        <Text style={styles.statLabel}>High Priority</Text>
                        <Text style={styles.statValue}>{highPriorityCount}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                            <MaterialIcons name="pending-actions" size={20} color="#3b82f6" />
                        </View>
                        <Text style={styles.statLabel}>Pending</Text>
                        <Text style={styles.statValue}>{pendingCount}</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {todayItems.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>TODAY</Text>
                                {todayItems.map(item => <AssignmentCard key={item.id} item={item} />)}
                            </>
                        )}

                        {yesterdayItems.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>YESTERDAY</Text>
                                {yesterdayItems.map(item => <AssignmentCard key={item.id} item={item} />)}
                            </>
                        )}

                        {earlierItems.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>EARLIER</Text>
                                {earlierItems.map(item => <AssignmentCard key={item.id} item={item} />)}
                            </>
                        )}

                        {assignments.length === 0 && (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="assignment-turned-in" size={64} color={theme.colors.textMuted} />
                                <Text style={styles.emptyText}>No assignments found</Text>
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('responder-dashboard')}>
                    <View style={styles.navIconWrapper}>
                        <MaterialIcons name="assignment" size={24} color={theme.colors.primary} />
                        {pendingCount > 0 && <View style={styles.navBadge} />}
                    </View>
                    <Text style={[styles.navLabel, { color: theme.colors.primary }]}>Assigned</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('profile')}>
                    <View style={styles.navIconWrapper}>
                        <MaterialIcons name="person" size={24} color={theme.colors.textMuted} />
                    </View>
                    <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => { }}>
                <MaterialIcons name="add" size={28} color={theme.colors.background} />
            </TouchableOpacity>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        // hover effect would be handled by TouchableOpacity opacity/color
    },
    segmentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    segmentWrapper: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: 4,
        height: 44,
    },
    segmentBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentBtnActive: {
        backgroundColor: theme.colors.background, // or white in light mode, but sticking to dark theme logic
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 1,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.textMuted,
    },
    segmentTextActive: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        // active state scaling handled by touchable
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 100,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-ish
    },
    badgeTextStatus: {
        color: '#63b3ed',
        fontSize: 10,
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: theme.colors.textMuted,
        marginTop: 16,
        fontSize: 16,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 20, // safe area padding
        paddingTop: 12,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    navIconWrapper: {
        padding: 4,
        position: 'relative',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: theme.colors.textMuted,
    },
    navBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    fab: {
        position: 'absolute',
        bottom: 96,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    }
});

export default ResponderDashboard;
