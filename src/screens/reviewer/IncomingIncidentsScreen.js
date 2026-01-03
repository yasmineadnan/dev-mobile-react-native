import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { FirebaseService } from '../../services/firebaseService';
import useStore from '../../store/useStore';
import { auth } from '../../firebase/config';

const IncomingIncidentsScreen = ({ onNavPress, onIncidentPress }) => {
    const { profile } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const filters = [
        { label: 'All', value: 'All' },
        { label: 'New', value: 'Open', count: 0 },
        { label: 'Pending Review', value: 'Pending Review' },
        { label: 'Investigation', value: 'Under Investigation' },
    ];

    useEffect(() => {
        // We listen to all incidents for the reviewer to dashboard
        const unsubscribe = FirebaseService.subscribeToAllIncidents((incidentsData) => {
            const mappedIncidents = incidentsData.map(data => ({
                ...data,
                timeAgo: getTimeAgo(data.createdAt),
                displayId: `#INC-${data.createdAt?.seconds || '0000'}-${data.id.substring(0, 3).toUpperCase()}`,
                priorityColor: getPriorityColor(data.priority),
                priorityIcon: getPriorityIcon(data.priority),
                categoryIcon: getCategoryIcon(data.category),
                statusBadgeLabel: getStatusBadgeLabel(data.status),
            }));
            setIncidents(mappedIncidents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const now = new Date();
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return date.toLocaleDateString();
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

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Safety': return 'warning';
            case 'Maintenance': return 'plumbing';
            case 'Security': return 'security';
            case 'IT Issue': return 'dns';
            default: return 'info';
        }
    };

    const getStatusBadgeLabel = (status) => {
        if (status === 'Open') return 'Needs Review';
        return status;
    };

    const filteredIncidents = incidents.filter(incident => {
        const matchesFilter = activeFilter === 'All' || incident.status === activeFilter;
        const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            incident.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Group incidents by date for section headers
    const today = new Date().toLocaleDateString();
    const todayIncidents = filteredIncidents.filter(i =>
        i.createdAt?.toDate ? i.createdAt.toDate().toLocaleDateString() === today : true
    );
    const earlierIncidents = filteredIncidents.filter(i =>
        i.createdAt?.toDate ? i.createdAt.toDate().toLocaleDateString() !== today : false
    );

    const IncidentCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: getPriorityColor(item.priority) }]}
            onPress={() => onIncidentPress(item.id)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '15', borderColor: getPriorityColor(item.priority) + '30' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
                    </View>
                    <Text style={styles.displayId}>{item.displayId}</Text>
                </View>
                <View style={styles.headerRight}>
                    <MaterialIcons name="schedule" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.timeAgoText}>{item.timeAgo}</Text>
                </View>
            </View>

            <View style={styles.cardMain}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.surfaceHighlight }]}>
                    <MaterialIcons name={getCategoryIcon(item.category)} size={24} color={item.priority === 'Critical' ? '#f97316' : theme.colors.blue} />
                </View>
                <View style={styles.titleContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <MaterialIcons name="person" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.footerText}>Reported by {item.reporterName || 'User'}</Text>
                </View>
                {item.status === 'Open' ? (
                    <Text style={styles.needsReviewText}>Needs Review</Text>
                ) : (
                    <View style={styles.footerItem}>
                        <MaterialIcons name="location-on" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.footerText}>{item.area || item.department}</Text>
                    </View>
                )}
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} style={styles.chevron} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Incoming Incidents</Text>
                    <TouchableOpacity style={styles.notiBtn}>
                        <MaterialIcons name="notifications" size={24} color={theme.colors.text} />
                        <View style={styles.notiBadge} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search incidents by ID, title..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity style={styles.filterBtn}>
                        <MaterialIcons name="tune" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.label}
                            style={[
                                styles.filterChip,
                                activeFilter === filter.value && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(filter.value)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter.value && styles.activeFilterText
                            ]}>
                                {filter.label}
                            </Text>
                            {filter.count > 0 && (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{filter.count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {todayIncidents.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>TODAY</Text>
                                    <Text style={styles.sectionCount}>{todayIncidents.length} Incidents</Text>
                                </View>
                                {todayIncidents.map(item => <IncidentCard key={item.id} item={item} />)}
                            </View>
                        )}

                        {earlierIncidents.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>EARLIER</Text>
                                    <Text style={styles.sectionCount}>{earlierIncidents.length} Incidents</Text>
                                </View>
                                {earlierIncidents.map(item => <IncidentCard key={item.id} item={item} />)}
                            </View>
                        )}

                        {filteredIncidents.length === 0 && (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="search-off" size={64} color={theme.colors.textMuted} />
                                <Text style={styles.emptyText}>No incidents found</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                <NavButton icon="assignment-late" label="Incidents" active onPress={() => onNavPress('incoming-incidents')} />
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fab}>
                        <MaterialIcons name="add" size={32} color={theme.colors.background} />
                    </TouchableOpacity>
                </View>
                <NavButton icon="assignment" label="Assignments" onPress={() => onNavPress('assignments-list')} />
                <NavButton icon="analytics" label="Reports" onPress={() => onNavPress('reports')} />
            </View>
        </SafeAreaView>
    );
};

const NavButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navBtn} onPress={onPress}>
        <MaterialIcons
            name={icon}
            size={24}
            color={active ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text style={[
            styles.navLabel,
            { color: active ? theme.colors.primary : theme.colors.textSecondary }
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
        paddingTop: 40,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(40, 57, 46, 0.5)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    notiBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notiBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: theme.colors.surfaceHighlight,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c2e22',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 14,
    },
    filterBtn: {
        padding: 4,
    },
    filtersScroll: {
        flexDirection: 'row',
        marginBottom: 8,
        marginHorizontal: -theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
    },
    filterChip: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: '#1c2e22',
        borderWidth: 1,
        borderColor: 'rgba(40, 57, 46, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        flexDirection: 'row',
    },
    activeFilterChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#000',
        fontWeight: '600',
    },
    countBadge: {
        backgroundColor: '#ef4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    countText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentPadding: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        letterSpacing: 1,
    },
    sectionCount: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    card: {
        backgroundColor: '#1c2e22',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    displayId: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeAgoText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    cardMain: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    needsReviewText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    chevron: {
        position: 'absolute',
        right: 8,
        top: '50%',
        marginTop: -12,
        opacity: 0,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: theme.colors.textMuted,
        marginTop: 12,
        fontSize: 16,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 100,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(40, 57, 46, 0.5)',
    },
    navBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    fabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        top: -20,
    },
});

export default IncomingIncidentsScreen;

