import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FirebaseService } from '../../services/firebaseService';
import useStore from '../../store/useStore';

const ReviewerIncidentDetailsScreen = ({ incidentId, onBack, onNavPress }) => {
    const { profile } = useStore();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!incidentId) return;

        const unsubscribe = onSnapshot(doc(db, 'incidents', incidentId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIncident({
                    id: docSnap.id,
                    ...data,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Just now',
                    priority: data.priority || 'Medium',
                    history: (data.statusHistory || []).map(h => ({
                        ...h,
                        formattedTime: h.timestamp ? new Date(h.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Unknown'
                    })).reverse()
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [incidentId]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return '#ef4444';
            case 'High': return '#f59e0b';
            case 'Medium': return theme.colors.primary;
            case 'Low': return '#64748b';
            default: return theme.colors.textMuted;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return '#f59e0b';
            case 'Pending Review': return '#f59e0b';
            case 'In Progress': return theme.colors.blue;
            case 'Resolved': return theme.colors.primary;
            default: return theme.colors.textMuted;
        }
    };

    const handleApprove = async () => {
        if (!incident.assignedTo) {
            // Navigate to assign responder if not assigned
            onNavPress('assign-responder');
        } else {
            // Approve and update status
            setActionLoading(true);
            try {
                await FirebaseService.approveIncident(incidentId, profile?.fullName || 'Reviewer');
                Alert.alert('Success', 'Incident approved successfully');
            } catch (error) {
                Alert.alert('Error', 'Failed to approve incident');
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleReject = () => {
        // Simple Alert instead of prompt to avoid Android crash
        Alert.alert(
            'Reject Incident',
            'This feature (rejection with reason) requires a custom modal on Android. For now, we are rejecting with a default reason.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject Anyway',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await FirebaseService.rejectIncident(incidentId, "Rejected by Reviewer", profile?.fullName || 'Reviewer');
                            Alert.alert('Success', 'Incident rejected');
                            onBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject incident');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePriorityChange = async (newPriority) => {
        setActionLoading(true);
        try {
            await FirebaseService.updateIncidentPriority(incidentId, newPriority);
        } catch (error) {
            Alert.alert('Error', 'Failed to update priority');
        } finally {
            setActionLoading(false);
        }
    };

    const showPriorityOptions = () => {
        Alert.alert(
            'Change Priority',
            'Select new priority level:',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Low', onPress: () => handlePriorityChange('Low') },
                { text: 'Medium', onPress: () => handlePriorityChange('Medium') },
                { text: 'High', onPress: () => handlePriorityChange('High') },
                { text: 'Critical', onPress: () => handlePriorityChange('Critical') },
            ]
        );
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
                <Text style={styles.headerTitle}>#{incident.id.substring(0, 8).toUpperCase()}</Text>
                <TouchableOpacity style={styles.moreBtn}>
                    <MaterialIcons name="more-vert" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                {/* Status & Priority Badges */}
                <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) + '30', borderColor: getStatusColor(incident.status) + '50' }]}>
                        <MaterialIcons name="info" size={18} color={getStatusColor(incident.status)} />
                        <Text style={[styles.badgeText, { color: getStatusColor(incident.status) }]}>{incident.status}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(incident.priority) + '30', borderColor: getPriorityColor(incident.priority) + '50' }]}>
                        <MaterialIcons name="flag" size={18} color={getPriorityColor(incident.priority)} />
                        <Text style={[styles.badgeText, { color: getPriorityColor(incident.priority) }]}>{incident.priority} Priority</Text>
                    </View>
                </View>

                {/* Incident Title */}
                <Text style={styles.title}>{incident.title}</Text>

                {/* Featured Image */}
                {incident.images && incident.images.length > 0 && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: incident.images[0] }} style={styles.featuredImage} />
                        <View style={styles.imageOverlay} />
                    </View>
                )}

                {/* Description */}
                <Text style={styles.description}>{incident.description}</Text>

                {/* Metadata Grid */}
                <View style={styles.metadataCard}>
                    <View style={styles.metadataGrid}>
                        <View style={styles.metadataItem}>
                            <View style={styles.metadataLabel}>
                                <MaterialIcons name="person" size={16} color={theme.colors.textSecondary} />
                                <Text style={styles.metadataLabelText}>REPORTER</Text>
                            </View>
                            <Text style={styles.metadataValue}>{incident.reporterName || 'Unknown'}</Text>
                        </View>
                        <View style={styles.metadataItem}>
                            <View style={styles.metadataLabel}>
                                <MaterialIcons name="schedule" size={16} color={theme.colors.textSecondary} />
                                <Text style={styles.metadataLabelText}>TIME</Text>
                            </View>
                            <Text style={styles.metadataValue}>{incident.time}</Text>
                        </View>
                        <View style={styles.metadataItem}>
                            <View style={styles.metadataLabel}>
                                <MaterialIcons name="location-on" size={16} color={theme.colors.textSecondary} />
                                <Text style={styles.metadataLabelText}>LOCATION</Text>
                            </View>
                            <Text style={styles.metadataValue}>{incident.area || incident.department}</Text>
                        </View>
                        <View style={styles.metadataItem}>
                            <View style={styles.metadataLabel}>
                                <MaterialIcons name="category" size={16} color={theme.colors.textSecondary} />
                                <Text style={styles.metadataLabelText}>CATEGORY</Text>
                            </View>
                            <Text style={styles.metadataValue}>{incident.category}</Text>
                        </View>
                    </View>
                </View>

                {/* Reviewer Actions */}
                <Text style={styles.sectionTitle}>Reviewer Actions</Text>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => onNavPress('assign-responder')}>
                        <View style={styles.actionLeft}>
                            <View style={styles.actionIcon}>
                                <MaterialIcons name="person-add" size={24} color={theme.colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.actionLabel}>Assigned Responder</Text>
                                <Text style={styles.actionValue}>{incident.assignedToName || 'Unassigned'}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={showPriorityOptions}>
                        <View style={styles.actionLeft}>
                            <View style={styles.actionIcon}>
                                <MaterialIcons name="priority-high" size={24} color={theme.colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.actionLabel}>Priority Level</Text>
                                <Text style={[styles.actionValue, { color: getPriorityColor(incident.priority) }]}>{incident.priority}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => onNavPress('incident-messages')}>
                        <View style={styles.actionLeft}>
                            <View style={styles.actionIcon}>
                                <MaterialIcons name="chat" size={24} color={theme.colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.actionLabel}>Messages</Text>
                                <Text style={styles.actionValue}>View Discussion</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Activity Timeline */}
                <Text style={styles.sectionTitle}>Activity History</Text>
                <View style={styles.timeline}>
                    {incident.history && incident.history.length > 0 ? (
                        incident.history.map((item, index) => (
                            <View key={index} style={styles.timelineItem}>
                                <View style={[
                                    styles.timelineDot,
                                    { backgroundColor: index === 0 ? theme.colors.primary : theme.colors.textMuted }
                                ]} />
                                <View style={styles.timelineContent}>
                                    <View style={styles.timelineHeader}>
                                        <Text style={styles.timelineTitle}>{item.status}</Text>
                                        <Text style={styles.timelineTime}>{item.formattedTime}</Text>
                                    </View>
                                    <Text style={styles.timelineNote}>{item.note}</Text>
                                    {item.user && <Text style={styles.timelineUser}>by {item.user}</Text>}
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No activity recorded</Text>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Footer Actions */}
            {incident.status !== 'Resolved' && incident.status !== 'Rejected' && (
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={handleReject}
                        disabled={actionLoading}
                    >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={handleApprove}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.background} />
                        ) : (
                            <Text style={styles.approveBtnText}>
                                {incident.assignedTo ? 'Approve' : 'Approve & Assign'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                <NavButton icon="assignment-late" label="Incidents" onPress={() => onNavPress('incoming-incidents')} />
                <NavButton icon="assignment-ind" label="Assignments" onPress={() => onNavPress('assignments-list')} />
                <NavButton icon="bar-chart" label="Stats" onPress={() => onNavPress('reports')} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    moreBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    contentPadding: {
        padding: theme.spacing.lg,
        paddingBottom: 180,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
        lineHeight: 32,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(to top, rgba(16, 34, 22, 0.8), transparent)',
    },
    description: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        lineHeight: 24,
        marginBottom: 24,
    },
    metadataCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    metadataGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    metadataItem: {
        width: '45%',
    },
    metadataLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    metadataLabelText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        letterSpacing: 1,
    },
    metadataValue: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
        marginTop: 8,
    },
    actionsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    actionValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    timeline: {
        paddingLeft: 8,
        marginBottom: 24,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 32,
        position: 'relative',
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 16,
        marginTop: 2,
        borderWidth: 4,
        borderColor: theme.colors.background,
    },
    timelineContent: {
        flex: 1,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    timelineTime: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    timelineNote: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 2,
    },
    timelineUser: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontStyle: 'italic',
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
    },
    footerActions: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background + 'F0',

        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    rejectBtn: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectBtnText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    approveBtn: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    approveBtnText: {
        color: theme.colors.background,
        fontSize: 14,
        fontWeight: 'bold',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#0c1a11',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
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
});

export default ReviewerIncidentDetailsScreen;


