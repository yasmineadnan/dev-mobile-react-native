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
import { FirebaseService } from '../../services/firebaseService';

const AssignmentsListScreen = ({ onNavPress, onIncidentPress }) => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToUnassignedIncidents((data) => {
            setIncidents(data);
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Unassigned Incidents</Text>
                <Text style={styles.headerSub}>{incidents.length} items needing attention</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
                ) : incidents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="check-circle" size={64} color={theme.colors.primary} />
                        <Text style={styles.emptyText}>All incidents are assigned!</Text>
                    </View>
                ) : (
                    incidents.map((incident) => (
                        <TouchableOpacity
                            key={incident.id}
                            style={styles.card}
                            onPress={() => onIncidentPress(incident.id)}
                        >
                            <View style={[styles.priorityLine, { backgroundColor: getPriorityColor(incident.priority) }]} />
                            <View style={styles.cardBody}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.incidentId}>#INC-{incident.id.substring(0, 4).toUpperCase()}</Text>
                                    <Text style={styles.timeAgo}>{getTimeAgo(incident.createdAt)}</Text>
                                </View>
                                <Text style={styles.title}>{incident.title}</Text>
                                <Text style={styles.category}>{incident.category} • {incident.area || incident.department}</Text>

                                <TouchableOpacity
                                    style={styles.assignBtn}
                                    onPress={() => {
                                        onIncidentPress(incident.id);
                                        onNavPress('assign-responder');
                                    }}
                                >
                                    <MaterialIcons name="person-add" size={18} color="#fff" />
                                    <Text style={styles.assignBtnText}>Assign Now</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                <NavButton icon="assignment-late" label="Incidents" onPress={() => onNavPress('incoming-incidents')} />
                <NavButton icon="assignment" label="Assignments" active onPress={() => { }} />
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
            color={active ? theme.colors.primary : '#9dabb9'}
        />
        <Text style={[styles.navLabel, { color: active ? theme.colors.primary : '#9dabb9' }]}>
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
        padding: 20,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSub: {
        fontSize: 14,
        color: '#9dabb9',
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    scrollPadding: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#283039',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 3,
    },
    priorityLine: {
        width: 4,
    },
    cardBody: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    incidentId: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    timeAgo: {
        fontSize: 12,
        color: '#9dabb9',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    category: {
        fontSize: 13,
        color: '#9dabb9',
        marginBottom: 16,
    },
    assignBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    assignBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
        marginTop: 16,
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
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
});

export default AssignmentsListScreen;

