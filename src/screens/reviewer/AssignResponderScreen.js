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

const AssignResponderScreen = ({ incidentId, onBack, onAssigned }) => {
    const [incident, setIncident] = useState(null);
    const [responders, setResponders] = useState([]);
    const [filteredResponders, setFilteredResponders] = useState([]);
    const [selectedResponder, setSelectedResponder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Available');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    const filters = [
        { label: 'Available', icon: 'check-circle', value: 'Available' },
        { label: 'Nearby', icon: 'near-me', value: 'Nearby' },
        { label: 'Electricians', icon: 'bolt', value: 'Electricians' },
        { label: 'Security', icon: 'security', value: 'Security' },
    ];

    useEffect(() => {
        loadData();
    }, [incidentId]);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, activeFilter, responders]);

    const loadData = async () => {
        try {
            // Load incident details
            const incidentData = await FirebaseService.getIncident(incidentId);
            setIncident(incidentData);

            // Load available responders
            const respondersData = await FirebaseService.getAvailableResponders();
            setResponders(respondersData);
            setFilteredResponders(respondersData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...responders];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(r =>
                r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply category filter
        if (activeFilter === 'Available') {
            filtered = filtered.filter(r => r.status === 'available');
        } else if (activeFilter === 'Nearby') {
            filtered = filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        } else if (activeFilter === 'Electricians') {
            filtered = filtered.filter(r => r.skills?.includes('Electrician'));
        } else if (activeFilter === 'Security') {
            filtered = filtered.filter(r => r.skills?.includes('Security'));
        }

        setFilteredResponders(filtered);
    };

    const handleConfirmAssignment = async () => {
        if (!selectedResponder) return;

        setAssigning(true);
        try {
            await FirebaseService.assignResponderToIncident(
                incidentId,
                selectedResponder.id,
                selectedResponder.fullName,
                selectedResponder.role
            );
            onAssigned?.();
            onBack();
        } catch (error) {
            console.error('Error assigning responder:', error);
            alert('Failed to assign responder. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return theme.colors.primary;
            case 'busy': return '#f59e0b';
            case 'offline': return '#ef4444';
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

    if (loading || !incident) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assign Responder</Text>
                <View style={{ width: 48 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                {/* Incident Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryLeft}>
                            <View style={styles.badgeRow}>
                                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(incident.priority) + '15', borderColor: getPriorityColor(incident.priority) + '30' }]}>
                                    <Text style={[styles.priorityText, { color: getPriorityColor(incident.priority) }]}>{incident.priority} Priority</Text>
                                </View>
                                <Text style={styles.statusLabel}>Needs Assignment</Text>
                            </View>
                            <Text style={styles.incidentTitle}>#{incident.id.substring(0, 4).toUpperCase()} - {incident.title}</Text>
                            <View style={styles.locationRow}>
                                <MaterialIcons name="location-on" size={16} color={theme.colors.textSecondary} />
                                <Text style={styles.locationText}>{incident.area} • {incident.department}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or skill..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
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
                            <MaterialIcons
                                name={filter.icon}
                                size={20}
                                color={activeFilter === filter.value ? theme.colors.background : theme.colors.text}
                            />
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter.value && styles.activeFilterText
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Available Responders</Text>
                    <Text style={styles.sectionCount}>{filteredResponders.length} found</Text>
                </View>

                {/* Responder List */}
                <View style={styles.responderList}>
                    {filteredResponders.map((responder) => (
                        <TouchableOpacity
                            key={responder.id}
                            style={[
                                styles.responderCard,
                                selectedResponder?.id === responder.id && styles.selectedCard,
                                responder.status !== 'available' && styles.disabledCard
                            ]}
                            onPress={() => responder.status === 'available' && setSelectedResponder(responder)}
                            disabled={responder.status !== 'available'}
                        >
                            <View style={styles.responderInfo}>
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={{ uri: responder.avatarUrl || `https://i.pravatar.cc/100?u=${responder.id}` }}
                                        style={[styles.avatar, responder.status !== 'available' && styles.avatarDisabled]}
                                    />
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(responder.status) }]} />
                                </View>
                                <View style={styles.responderDetails}>
                                    <Text style={styles.responderName}>{responder.fullName}</Text>
                                    <Text style={styles.responderRole}>
                                        {responder.role}
                                        {responder.distance !== undefined && (
                                            <Text style={styles.distanceText}> • <Text style={{ color: theme.colors.primary }}>{responder.distance} mi</Text></Text>
                                        )}
                                        {responder.status === 'busy' && <Text style={{ color: '#f59e0b' }}> • Busy</Text>}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.selectionIndicator}>
                                {selectedResponder?.id === responder.id ? (
                                    <View style={styles.selectedIndicator}>
                                        <MaterialIcons name="check" size={16} color={theme.colors.background} />
                                    </View>
                                ) : (
                                    <View style={styles.unselectedIndicator} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Confirm Button */}
            {selectedResponder && (
                <View style={styles.bottomAction}>
                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmAssignment}
                        disabled={assigning}
                    >
                        {assigning ? (
                            <ActivityIndicator size="small" color={theme.colors.background} />
                        ) : (
                            <>
                                <Text style={styles.confirmText}>Confirm Assignment</Text>
                                <MaterialIcons name="arrow-forward" size={20} color={theme.colors.background} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    contentPadding: {
        padding: theme.spacing.lg,
        paddingBottom: 120,
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLeft: {
        flex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    incidentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceHighlight,
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
    filtersScroll: {
        flexDirection: 'row',
        marginBottom: 16,
        marginHorizontal: -theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
    },
    filterChip: {
        flexDirection: 'row',
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeFilterChip: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    filterText: {
        color: theme.colors.text,
        fontSize: 13,
        fontWeight: '500',
    },
    activeFilterText: {
        color: theme.colors.background,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    sectionCount: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    responderList: {
        gap: 12,
    },
    responderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledCard: {
        opacity: 0.5,
        backgroundColor: 'rgba(28, 39, 31, 0.5)',
    },
    responderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarDisabled: {
        opacity: 0.4,
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    responderDetails: {
        flex: 1,
    },
    responderName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    responderRole: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    distanceText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    selectionIndicator: {
        width: 24,
        height: 24,
    },
    selectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unselectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bottomAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        paddingBottom: 30,
        backgroundColor: theme.colors.background,
    },
    confirmBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.background,
    },
});

export default AssignResponderScreen;

