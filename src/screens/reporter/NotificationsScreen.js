import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { auth } from '../../firebase/config';
import { useEffect, useState } from 'react';
import { FirebaseService } from '../../services/firebaseService';
import useStore from '../../store/useStore';

const NotificationsScreen = ({ onNavPress }) => {
    const { profile } = useStore();
    const role = profile?.role || 'Reporter';
    const [activeFilter, setActiveFilter] = useState('All');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const filters = [
        { id: 'All', icon: 'check-circle', label: 'All' },
        { id: 'Unread', icon: 'circle', label: 'Unread' },
        { id: 'Alerts', icon: 'warning', label: 'Alerts' },
        { id: 'Mentions', icon: 'comment', label: 'Mentions' },
    ];

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = FirebaseService.subscribeToNotifications(
            auth.currentUser.uid,
            (data) => {
                const mapped = data.map(n => ({
                    ...n,
                    time: n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                    group: isToday(n.createdAt?.toDate?.()) ? 'Today' : 'Earlier'
                }));
                setNotifications(mapped);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Notifications Sync Error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Safety timeout for loading state
        const timer = setTimeout(() => {
            if (loading) setLoading(false);
        }, 8000);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const handleSeedData = async () => {
        setLoading(true);
        try {
            await FirebaseService.seedTestNotifications(auth.currentUser.uid);
            alert('Test notifications created!');
        } catch (err) {
            console.error("Seeding error:", err);
            alert('Failed to seed data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const isToday = (someDate) => {
        if (!someDate) return true;
        const today = new Date();
        return someDate.getDate() === today.getDate() &&
            someDate.getMonth() === today.getMonth() &&
            someDate.getFullYear() === today.getFullYear();
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        for (const n of unread) {
            await FirebaseService.markNotificationRead(n.id);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeFilter === 'Unread') return !n.read;
        if (activeFilter === 'Alerts') return n.type === 'warning' || n.category === 'Alert';
        if (activeFilter === 'Mentions') return n.type === 'chat-bubble';
        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <TouchableOpacity onPress={handleMarkAllRead}>
                        <Text style={styles.markReadText}>Mark all read</Text>
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterContent}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                activeFilter === filter.id && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(filter.id)}
                        >
                            <MaterialIcons
                                name={filter.icon}
                                size={18}
                                color={activeFilter === filter.id ? theme.colors.background : theme.colors.textMuted}
                            />
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter.id && styles.activeFilterText
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator color={theme.colors.primary} size="large" />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                        <Text style={styles.indexHint}>If this takes too long, your Firestore Index might still be building.</Text>

                        {/* Show seed button during loading if it takes more than 3 seconds */}
                        <TouchableOpacity
                            style={[styles.seedBtn, { marginTop: 32, opacity: 0.8 }]}
                            onPress={handleSeedData}
                        >
                            <Text style={styles.seedBtnText}>Seed Data Anyway</Text>
                        </TouchableOpacity>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
                        <Text style={styles.errorText}>Sync Error</Text>
                        <Text style={styles.emptySubText}>{error}</Text>
                        <TouchableOpacity style={styles.seedBtn} onPress={handleSeedData}>
                            <Text style={styles.seedBtnText}>Seed Test Data Anyway</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredNotifications.length > 0 ? (
                    <>
                        {/* Group: Today */}
                        {filteredNotifications.filter(n => n.group === 'Today').length > 0 && (
                            <>
                                <Text style={styles.groupLabel}>TODAY</Text>
                                {filteredNotifications.filter(n => n.group === 'Today').map(item => (
                                    <NotificationItem
                                        key={item.id}
                                        item={{
                                            ...item,
                                            unread: !item.read,
                                            type: item.type || 'info',
                                            iconColor: item.iconColor || theme.colors.primary,
                                            iconBg: item.iconBg || 'rgba(19, 236, 91, 0.15)'
                                        }}
                                    />
                                ))}
                            </>
                        )}

                        {/* Group: Earlier */}
                        {filteredNotifications.filter(n => n.group === 'Earlier').length > 0 && (
                            <>
                                <Text style={[styles.groupLabel, { marginTop: 24 }]}>EARLIER</Text>
                                {filteredNotifications.filter(n => n.group === 'Earlier').map(item => (
                                    <NotificationItem
                                        key={item.id}
                                        item={{
                                            ...item,
                                            unread: !item.read,
                                            type: item.type || 'info',
                                            iconColor: item.iconColor || theme.colors.primary,
                                            iconBg: item.iconBg || 'rgba(19, 236, 91, 0.15)'
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    /* All Caught Up */
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <MaterialIcons name="notifications-none" size={48} color={theme.colors.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubText}>You're all caught up! New alerts will appear here.</Text>
                        <TouchableOpacity style={styles.seedBtn} onPress={handleSeedData}>
                            <MaterialIcons name="add" size={20} color={theme.colors.background} />
                            <Text style={styles.seedBtnText}>Seed Test Data</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
                ) : (
                    <>
                        <NavButton icon="home" label="Home" onPress={() => onNavPress('home')} />
                        <NavButton icon="assignment" label="Incidents" onPress={() => onNavPress('my-incidents')} />
                        <NavButton icon="notifications" label="Notifs" active onPress={() => onNavPress('notifications')} />
                        <NavButton icon="person" label="Profile" onPress={() => onNavPress('profile')} />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const NotificationItem = ({ item }) => (
    <TouchableOpacity
        style={[styles.notiCard, !item.unread && styles.readNotiCard]}
        onPress={() => item.unread && FirebaseService.markNotificationRead(item.id)}
    >
        <View style={[styles.notiIconWrapper, { backgroundColor: item.iconBg }]}>
            <MaterialIcons name={item.type} size={26} color={item.iconColor} />
        </View>
        <View style={styles.notiContent}>
            <View style={styles.notiTextColumn}>
                <Text style={styles.notiTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.spacing4} />
                <Text style={styles.notiMessage} numberOfLines={3}>{item.message}</Text>
            </View>
        </View>
        <View style={styles.notiRightSide}>
            <Text style={[styles.notiTime, item.unread && styles.unreadTime]}>{item.time}</Text>
            {item.unread && (
                <View style={styles.unreadDot} />
            )}
        </View>
    </TouchableOpacity>
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
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingTop: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    markReadText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    filterScroll: {
        paddingVertical: 12,
    },
    filterContent: {
        paddingHorizontal: theme.spacing.lg,
        gap: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 12,
    },
    groupLabel: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    notiCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 16,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    readNotiCard: {
        opacity: 0.7,
        borderColor: 'transparent',
    },
    notiIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notiContent: {
        flex: 1,
        paddingTop: 2,
    },
    notiTextColumn: {
        flex: 1,
    },
    notiTitle: {
        color: theme.colors.text,
        fontSize: 17,
        fontWeight: '800',
        lineHeight: 22,
        letterSpacing: 0.3,
    },
    spacing4: {
        height: 6,
    },
    notiMessage: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
    },
    notiRightSide: {
        alignItems: 'flex-end',
        paddingTop: 4,
        paddingLeft: 8,
    },
    notiTime: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    unreadTime: {
        color: theme.colors.primary,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        marginTop: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
    },
    emptyTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    loadingText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
    },
    indexHint: {
        color: theme.colors.textMuted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 40,
    },
    seedBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    seedBtnText: {
        color: theme.colors.background,
        fontWeight: 'bold',
        fontSize: 14,
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
});

export default NotificationsScreen;

