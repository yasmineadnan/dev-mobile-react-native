import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

import { FirebaseService } from '../../services/firebaseService';
import useStore from '../../store/useStore';

const MyIncidentsScreen = ({ onNavPress, onIncidentPress }) => {
    const { profile } = useStore();
    const role = profile?.role || 'Reporter';
    const [activeFilter, setActiveFilter] = useState('All');
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const filters = ['All', 'Open', 'In Progress', 'Resolved'];

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = FirebaseService.subscribeToUserIncidents(auth.currentUser.uid, (incidentsData) => {
            const mappedIncidents = incidentsData.map(data => ({
                ...data,
                // Map Firestore data to the UI format
                time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Just now',
                icon: getIconForCategory(data.category),
                iconBg: 'rgba(255,255,255,0.05)',
                iconColor: getColorForStatus(data.status),
                statusColor: getColorForStatus(data.status),
                location: data.area || data.department || 'Unknown',
            }));
            setIncidents(mappedIncidents);
            setLoading(false);
        });

        return () => unsubscribe();
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
            case 'Open': return theme.colors.blue;
            case 'In Progress': return theme.colors.orange;
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

    const filteredIncidents = incidents.filter(incident =>
        activeFilter === 'All' || incident.status === activeFilter
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>My Incidents</Text>
                    <TouchableOpacity style={styles.filterMenuBtn}>
                        <MaterialIcons name="filter-list" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterContent}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter)}
                            style={[
                                styles.filterChip,
                                activeFilter === filter && styles.activeFilterChip
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter && styles.activeFilterText
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Incident List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Fetching your incidents...</Text>
                    </View>
                ) : filteredIncidents.length > 0 ? (
                    filteredIncidents.map((incident) => (
                        <TouchableOpacity
                            key={incident.id}
                            style={styles.incidentCard}
                            onPress={() => onIncidentPress(incident.id)}
                        >
                            <View style={styles.cardTop}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconWrapper, { backgroundColor: incident.iconBg }]}>
                                        <MaterialIcons name={incident.icon} size={24} color={incident.iconColor} />
                                    </View>
                                    <View style={styles.titleInfo}>
                                        <Text style={styles.incidentTitle}>{incident.title}</Text>
                                        <Text style={styles.incidentMeta}>ID: #{incident.id.substring(0, 6)} • {incident.time}</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
                            </View>

                            <View style={styles.cardBottom}>
                                <View style={styles.locationRow}>
                                    <MaterialIcons name="location-on" size={14} color={theme.colors.textMuted} />
                                    <Text style={styles.locationText}>{incident.location}</Text>
                                </View>
                                <View style={styles.badgeRow}>
                                    <View style={[
                                        styles.priorityBadge,
                                        { borderColor: getPriorityColor(incident.priority) + '40' }
                                    ]}>
                                        <MaterialIcons
                                            name={getPriorityIcon(incident.priority)}
                                            size={12}
                                            color={getPriorityColor(incident.priority)}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.priorityText, { color: getPriorityColor(incident.priority) }]}>
                                            {(incident.priority || 'Medium').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: incident.statusColor + '15' }
                                    ]}>
                                        {incident.status === 'Resolved' && (
                                            <MaterialIcons name="check" size={12} color={incident.statusColor} style={{ marginRight: 4 }} />
                                        )}
                                        <Text style={[styles.statusText, { color: incident.statusColor }]}>
                                            {incident.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="assignment-late" size={64} color={theme.colors.textMuted} />
                        <Text style={styles.emptyStateTitle}>No Incidents Found</Text>
                        <Text style={styles.emptyStateSub}>You haven't reported any incidents with the "{activeFilter}" status yet.</Text>
                    </View>
                )}
                {/* Spacer for FAB */}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => onNavPress('new-incident')}
            >
                <MaterialIcons name="add" size={32} color={theme.colors.background} />
            </TouchableOpacity>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {role === 'Reviewer' ? (
                    <>
                        <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                        <NavButton icon="assignment-late" label="Incidents" active onPress={() => onNavPress('incoming-incidents')} />
                        <NavButton icon="assignment-ind" label="My Tasks" onPress={() => { }} />
                        <NavButton icon="person" label="Profile" onPress={() => onNavPress('profile')} />
                    </>
                ) : (
                    <>
                        <NavButton icon="home" label="Home" onPress={() => onNavPress('home')} />
                        <NavButton icon="assignment" label="Incidents" active onPress={() => onNavPress('my-incidents')} />
                        <NavButton icon="notifications" label="Notifs" onPress={() => onNavPress('notifications')} />
                        <NavButton icon="person" label="Profile" onPress={() => onNavPress('profile')} />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

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
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.sm,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    filterMenuBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterScroll: {
        paddingLeft: theme.spacing.lg,
    },
    filterContent: {
        paddingRight: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        gap: 12,
    },
    filterChip: {
        height: 36,
        paddingHorizontal: 20,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeFilterChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    activeFilterText: {
        color: theme.colors.background,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
    },
    incidentCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.xl,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleInfo: {
        flex: 1,
    },
    incidentTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    incidentMeta: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 8,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
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
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: theme.colors.textSecondary,
        marginTop: 16,
        fontSize: 14,
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptyStateSub: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});

export default MyIncidentsScreen;

