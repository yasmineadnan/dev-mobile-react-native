import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Image,
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

const IncidentDetailsScreen = ({ incidentId, onBack, onNavPress }) => {
    const { profile } = useStore();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!incidentId) return;

        const unsubscribe = onSnapshot(doc(db, 'incidents', incidentId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIncident({
                    id: docSnap.id,
                    ...data,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Just now',
                    icon: getIconForCategory(data.category),
                    priority: data.priority || 'Medium',
                    priorityColor: getPriorityColor(data.priority || 'Medium'),
                    // Dynamic history
                    history: (data.statusHistory || []).map(h => ({
                        ...h,
                        formattedTime: h.timestamp ? new Date(h.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Unknown'
                    })).reverse() // Show latest first
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [incidentId]);

    const handleAddUpdate = async () => {
        Alert.alert(
            "Add Update",
            "This feature will be available in the next version.",
            [{ text: "OK" }]
        );
    };

    const getIconForCategory = (category) => {
        switch (category) {
            case 'Safety': return 'warning';
            case 'Maintenance': return 'build';
            case 'Security': return 'security';
            case 'IT Issue': return 'computer';
            default: return 'info';
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return theme.colors.blue;
            case 'In Progress': return theme.colors.orange;
            case 'Resolved': return theme.colors.primary;
            default: return theme.colors.textMuted;
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Incident #{incidentId}</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="more-horiz" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading incident details...</Text>
                    </View>
                ) : incident ? (
                    <>
                        {/* Status & Priority Section */}
                        <View style={styles.topSection}>
                            <View style={styles.badgeRow}>
                                <View style={[styles.badge, styles.priorityBadge, { borderColor: incident.priorityColor + '40' }]}>
                                    <MaterialIcons name={getPriorityIcon(incident.priority)} size={14} color={incident.priorityColor} />
                                    <Text style={[styles.badgeText, { color: incident.priorityColor }]}>{incident.priority.toUpperCase()} SEVERITY</Text>
                                </View>
                                <View style={[styles.badge, styles.statusBadge, { borderColor: getStatusColor(incident.status) + '40' }]}>
                                    <MaterialIcons name="sync" size={14} color={getStatusColor(incident.status)} />
                                    <Text style={[styles.badgeText, { color: getStatusColor(incident.status) }]}>{incident.status.toUpperCase()}</Text>
                                </View>
                            </View>

                            <Text style={styles.mainTitle}>{incident.title}</Text>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <MaterialIcons name="calendar-today" size={16} color={theme.colors.textMuted} />
                                    <Text style={styles.metaText}>{incident.time}</Text>
                                </View>
                                <Text style={styles.metaDivider}>•</Text>
                                <View style={styles.metaItem}>
                                    <MaterialIcons name="person" size={16} color={theme.colors.textMuted} />
                                    <Text style={styles.metaText}>{incident.reporterName || 'Unknown'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Location Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>LOCATION</Text>
                            <View style={styles.locationCard}>
                                <LocationItem
                                    icon="domain"
                                    label="DEPARTMENT"
                                    value={incident.department}
                                    iconBg="rgba(59, 130, 246, 0.1)"
                                    iconColor="#3b82f6"
                                />
                                <View style={styles.innerDivider} />
                                <LocationItem
                                    icon="meeting-room"
                                    label="OFFICE NUMBER"
                                    value={incident.office}
                                    iconBg="rgba(168, 85, 247, 0.1)"
                                    iconColor="#a855f7"
                                />
                                <View style={styles.innerDivider} />
                                <LocationItem
                                    icon="location-on"
                                    label="SPECIFIC AREA"
                                    value={incident.area}
                                    iconBg="rgba(245, 158, 11, 0.1)"
                                    iconColor="#f59e0b"
                                />
                            </View>
                        </View>

                        {/* Description Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                            <Text style={styles.descriptionText}>
                                {incident.description}
                            </Text>
                        </View>

                        {/* Media Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>MEDIA</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1558491230-c605bcad001d?q=80&w=200' }}
                                    style={styles.mediaThumb}
                                />
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=200' }}
                                    style={styles.mediaThumb}
                                />
                                <TouchableOpacity style={styles.addMediaThumb}>
                                    <MaterialIcons name="add-a-photo" size={24} color={theme.colors.textMuted} />
                                    <Text style={styles.addMediaText}>Add Photo</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>

                        {/* Responder Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>ASSIGNED RESPONDER</Text>
                            {incident.assignedToName ? (
                                <View style={styles.responderCard}>
                                    <View style={styles.responderInfo}>
                                        <Image
                                            source={{ uri: `https://i.pravatar.cc/100?u=${incident.assignedTo}` }}
                                            style={styles.responderAvatar}
                                        />
                                        <View>
                                            <Text style={styles.responderName}>{incident.assignedToName}</Text>
                                            <Text style={styles.responderRole}>{incident.assignedToRole || 'Technician'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.responderActions}>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '20' }]}>
                                            <MaterialIcons name="call" size={20} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionBtn}>
                                            <MaterialIcons name="chat" size={20} color={theme.colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.noResponderContainer}>
                                    <MaterialIcons name="person-add" size={48} color={theme.colors.textMuted} />
                                    <Text style={styles.noResponderText}>No responder assigned yet</Text>
                                    {profile?.role === 'Reviewer' && (
                                        <TouchableOpacity
                                            style={styles.assignBtn}
                                            onPress={() => onNavPress('assign-responder')}
                                        >
                                            <MaterialIcons name="person-add" size={20} color={theme.colors.background} />
                                            <Text style={styles.assignBtnText}>Assign Responder</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Messages Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>MESSAGES</Text>
                            <TouchableOpacity
                                style={styles.messagesBtn}
                                onPress={() => onNavPress('incident-messages')}
                            >
                                <View style={styles.messagesBtnContent}>
                                    <MaterialIcons name="chat" size={24} color={theme.colors.primary} />
                                    <View style={styles.messagesBtnText}>
                                        <Text style={styles.messagesBtnTitle}>View Discussion</Text>
                                        <Text style={styles.messagesBtnSubtitle}>Communicate with reviewers and responders</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Activity Log */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>ACTIVITY LOG</Text>
                            <View style={styles.timeline}>
                                {incident.history && incident.history.length > 0 ? (
                                    incident.history.map((item, index) => (
                                        <TimelineItem
                                            key={index}
                                            time={item.formattedTime}
                                            content={item.note}
                                            user={item.user}
                                            isUpdate={item.user !== 'System'}
                                            isStatusChange={item.type === 'status_change'}
                                            isFirst={index === 0}
                                            isLast={index === incident.history.length - 1}
                                        />
                                    ))
                                ) : (
                                    <TimelineItem
                                        time={incident.time}
                                        content="Incident created"
                                        user={incident.reporterName}
                                        isLast
                                    />
                                )}
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.notFound}>
                        <MaterialIcons name="error-outline" size={64} color={theme.colors.textMuted} />
                        <Text style={styles.notFoundTitle}>Incident Not Found</Text>
                        <TouchableOpacity onPress={onBack} style={styles.backLink}>
                            <Text style={styles.backLinkText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Floating Action Button */}
            {incident && (
                <TouchableOpacity style={styles.fab} onPress={handleAddUpdate}>
                    <MaterialIcons name="edit-note" size={24} color={theme.colors.background} />
                    <Text style={styles.fabText}>Add Update</Text>
                </TouchableOpacity>
            )}

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <NavButton icon="home" label="Home" onPress={() => onNavPress('home')} />
                <NavButton icon="assignment-late" label="My Incidents" active onPress={() => onNavPress('my-incidents')} />
                <NavButton icon="notifications" label="Notifications" onPress={() => onNavPress('notifications')} />
                <NavButton icon="person" label="Profile" onPress={() => onNavPress('profile')} />
            </View>
        </SafeAreaView>
    );
};

const LocationItem = ({ icon, label, value, iconBg, iconColor }) => (
    <View style={styles.locationItem}>
        <View style={[styles.locIconWrapper, { backgroundColor: iconBg }]}>
            <MaterialIcons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.locInfo}>
            <Text style={styles.locLabel}>{label}</Text>
            <Text style={styles.locValue}> {value}</Text>
        </View>
    </View>
);

const TimelineItem = ({ time, content, user, isUpdate, isStatusChange, isFirst, isLast }) => (
    <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
            <View style={[styles.timelineLine, isFirst && { top: 12 }, isLast && { bottom: '100%', height: 12 }]} />
            <View style={[styles.timelineDot, isUpdate && { backgroundColor: theme.colors.primary }]} />
        </View>
        <View style={styles.timelineRight}>
            <Text style={styles.timelineTime}>{time}</Text>
            <View style={[styles.timelineContent, isUpdate && styles.updateContent]}>
                {isStatusChange ? (
                    <Text style={styles.timelineText}>
                        Status changed to <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>In Progress</Text>
                    </Text>
                ) : (
                    <Text style={styles.timelineText}>{content}</Text>
                )}
                {user && <Text style={[styles.timelineUser, isUpdate && { color: theme.colors.primary }]}>{user}</Text>}
            </View>
        </View>
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
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    topSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
    },
    priorityBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusBadge: {
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    mainTitle: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 32,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
    metaDivider: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        opacity: 0.5,
        marginVertical: 20,
    },
    section: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 24,
    },
    sectionLabel: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    locationCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    locIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locInfo: {
        flex: 1,
    },
    locLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    locValue: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    innerDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginHorizontal: 12,
    },
    descriptionText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        lineHeight: 24,
    },
    mediaScroll: {
        flexDirection: 'row',
    },
    mediaThumb: {
        width: 112,
        height: 112,
        borderRadius: 16,
        marginRight: 12,
    },
    addMediaThumb: {
        width: 112,
        height: 112,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    addMediaText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '600',
    },
    responderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    responderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    responderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    responderName: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    responderRole: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    responderActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeline: {
        paddingLeft: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineLeft: {
        width: 20,
        alignItems: 'center',
    },
    timelineLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4a5568',
        borderWidth: 2,
        borderColor: theme.colors.background,
        marginTop: 6,
        zIndex: 1,
    },
    timelineRight: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 24,
    },
    timelineTime: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginBottom: 6,
    },
    timelineContent: {
        backgroundColor: 'transparent',
    },
    updateContent: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 12,
        borderTopLeftRadius: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
    },
    timelineText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    timelineUser: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 8,
        color: theme.colors.textMuted,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        gap: 8,
        elevation: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    fabText: {
        color: theme.colors.background,
        fontSize: 15,
        fontWeight: 'bold',
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
    noResponderContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderStyle: 'dashed',
    },
    noResponderText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginTop: 8,
        marginBottom: 16,
    },
    assignBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    assignBtnText: {
        color: theme.colors.background,
        fontSize: 14,
        fontWeight: 'bold',
    },
    messagesBtn: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    messagesBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    messagesBtnText: {
        flex: 1,
    },
    messagesBtnTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    messagesBtnSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
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
    notFound: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    notFoundTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    backLink: {
        marginTop: 20,
    },
    backLinkText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default IncidentDetailsScreen;

