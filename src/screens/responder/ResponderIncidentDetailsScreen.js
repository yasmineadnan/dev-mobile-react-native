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
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { FirebaseService } from '../../services/firebaseService';
import { auth } from '../../firebase/config';

const ResponderIncidentDetailsScreen = ({ incidentId, onBack, onNavPress }) => {
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!incidentId) return;

        const fetchIncident = async () => {
            const data = await FirebaseService.getIncident(incidentId);
            setIncident(data);
            setLoading(false);
        };

        fetchIncident();

        // Also subscribe to updates if needed, but getIncident is simple for now. 
        // Ideally we use a listener for real-time updates.
        const unsubscribe = FirebaseService.subscribeToIncidentMessages(incidentId, () => { }, () => { }); // Just a placeholder if we wanted real-time

        return () => unsubscribe();
    }, [incidentId]);

    const handleUpdateStatus = () => {
        onNavPress('update-status');
    };

    const updateStatus = async (newStatus) => {
        try {
            await FirebaseService.updateIncidentStatus(incidentId, newStatus, `Status updated by Responder`, auth.currentUser?.email);
            setIncident(prev => ({ ...prev, status: newStatus }));
            Alert.alert("Success", `Status updated to ${newStatus}`);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update status");
        }
    };

    const handleUploadProof = () => {
        Alert.alert("Upload Proof", "Camera/Gallery integration would go here.");
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!incident) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.text }}>Incident not found.</Text>
                <TouchableOpacity onPress={onBack} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getPriorityColor = (level) => {
        switch (level) {
            case 'Critical': return '#ef4444';
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#13ec5b';
            default: return theme.colors.textMuted;
        }
    };

    const StatusBadge = ({ status }) => {
        const isResolved = status === 'Resolved' || status === 'Closed';
        return (
            <View style={[styles.statusBadge, isResolved && { backgroundColor: 'rgba(19, 236, 91, 0.1)', borderColor: 'rgba(19, 236, 91, 0.2)' }]}>
                <Text style={[styles.statusText, isResolved && { color: theme.colors.primary }]}>{status}</Text>
            </View>
        );
    };

    const assignedDate = incident.statusHistory?.find(h => h.status === 'In Progress' || h.note?.includes('Assigned'))?.timestamp;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Top Navigation */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>#{incident.id.slice(0, 8).toUpperCase()}</Text>
                <TouchableOpacity style={styles.moreBtn}>
                    <MaterialIcons name="more-vert" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Incident Status Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={styles.metaRow}>
                                <StatusBadge status={incident.status} />
                                <Text style={styles.timeAgo}>2h ago</Text>
                            </View>
                            <Text style={styles.incidentTitle}>{incident.title}</Text>
                        </View>
                        {/* Thumbnail */}
                        <View style={styles.thumbnailContainer}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1542013936693-88463832181d?q=80&w=200' }}
                                style={styles.thumbnail}
                            />
                        </View>
                    </View>

                    {/* Quick Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <MaterialIcons name="priority-high" size={20} color={getPriorityColor(incident.priority)} />
                            <View>
                                <Text style={styles.statLabel}>PRIORITY</Text>
                                <Text style={[styles.statValue, { color: getPriorityColor(incident.priority) }]}>{incident.priority}</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
                            <View>
                                <Text style={styles.statLabel}>LOCATION</Text>
                                <Text style={styles.statValue}>{incident.location || incident.area || 'Unknown'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Incident Description</Text>
                    <View style={styles.descriptionCard}>
                        <Text style={styles.descriptionText}>
                            {incident.description}
                        </Text>
                        <View style={styles.reporterRow}>
                            <View style={styles.avatar}>
                                <MaterialIcons name="person" size={24} color={theme.colors.textSecondary} />
                            </View>
                            <View style={styles.reporterInfo}>
                                <Text style={styles.reporterName}>{incident.reporterName || 'Anonymous'}</Text>
                                <Text style={styles.reporterRole}>Reporter • {incident.department || 'Staff'}</Text>
                            </View>
                            <TouchableOpacity style={styles.chatBtn}>
                                <MaterialIcons name="chat" size={18} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Activity Log */}
                <View style={[styles.section, { paddingBottom: 100 }]}>
                    <Text style={styles.sectionTitle}>Activity Log</Text>
                    <View style={styles.timeline}>
                        {/* Vertical Line */}
                        <View style={styles.timelineLine} />

                        {assignedDate && (
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIconContainer, { backgroundColor: theme.colors.primary }]}>
                                    <MaterialIcons name="build" size={20} color={theme.colors.background} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <View style={styles.timelineHeader}>
                                        <Text style={styles.timelineTitle}>Assigned to You</Text>
                                        <Text style={styles.timelineTime}>10m ago</Text>
                                    </View>
                                    <Text style={styles.timelineDesc}>
                                        You have been assigned to this incident.
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineIconContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
                                <MaterialIcons name="admin-panel-settings" size={20} color={theme.colors.text} />
                            </View>
                            <View style={styles.timelineContent}>
                                <View style={styles.timelineHeader}>
                                    <Text style={styles.timelineTitle}>Reported</Text>
                                    <Text style={styles.timelineTime}>2h ago</Text>
                                </View>
                                <View style={styles.noteBox}>
                                    <Text style={styles.noteText}>"{incident.description.slice(0, 50)}..."</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={styles.actionFooter}>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateStatus}>
                        <MaterialIcons name="edit-note" size={20} color={theme.colors.text} />
                        <Text style={styles.updateBtnText}>Update Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadProof}>
                        <MaterialIcons name="upload-file" size={20} color={theme.colors.background} />
                        <Text style={styles.uploadBtnText}>Upload Proof</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('responder-dashboard')}>
                    <View style={styles.navIconWrapper}>
                        <MaterialIcons name="assignment-ind" size={24} color={theme.colors.primary} />
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    scrollContent: {
        paddingTop: 16,
    },
    statusBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 100,
        marginRight: 8,
    },
    statusText: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: 'bold',
    },
    card: {
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 16,
    },
    cardHeaderLeft: {
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeAgo: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    incidentTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        lineHeight: 26,
    },
    thumbnailContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceHighlight,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 12,
        gap: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    descriptionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    descriptionText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 16,
    },
    reporterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reporterInfo: {
        flex: 1,
    },
    reporterName: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 14,
    },
    reporterRole: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    chatBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeline: {
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 19,
        top: 16,
        bottom: 16,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 0,
    },
    timelineItem: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
        zIndex: 1,
    },
    timelineIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: theme.colors.background,
    },
    timelineContent: {
        flex: 1,
        paddingTop: 4,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    timelineTime: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    timelineDesc: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    noteBox: {
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 8,
        borderTopLeftRadius: 0,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    noteText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        fontSize: 13,
    },
    actionFooter: {
        position: 'absolute',
        bottom: 80, // Above bottom nav
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 8,
        paddingTop: 16,
        backgroundColor: theme.colors.background, // Gradient effect tricky, keeping solid for now or make transparent?
        // Using a gradient in RN requires expo-linear-gradient, which user has not specified.
        // Will use solid background to be safe.
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    updateBtn: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    updateBtnText: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 14,
    },
    uploadBtn: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadBtnText: {
        color: theme.colors.background,
        fontWeight: 'bold',
        fontSize: 14,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 20,
        paddingTop: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 80,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navIconWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 20,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.textMuted,
    },
});

export default ResponderIncidentDetailsScreen;
