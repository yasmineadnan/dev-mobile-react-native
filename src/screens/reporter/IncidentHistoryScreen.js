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

const IncidentHistoryScreen = ({ onBack, onNavPress }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        // Fetch all incidents reported by user and flatten their history logs
        const q = query(
            collection(db, 'incidents'),
            where('reporterId', '==', auth.currentUser.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let allLogs = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const logs = (data.statusHistory || []).map(h => ({
                    ...h,
                    incidentTitle: data.title,
                    incidentId: doc.id,
                    formattedTime: h.timestamp ? new Date(h.timestamp).toLocaleString() : 'Recently'
                }));
                allLogs = [...allLogs, ...logs];
            });
            // Sort merged logs by timestamp desc
            allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(allLogs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Incident History</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary} size="large" />
                        <Text style={styles.loadingText}>Loading history logs...</Text>
                    </View>
                ) : history.length > 0 ? (
                    history.map((log, index) => (
                        <View key={index} style={styles.historyCard}>
                            <View style={styles.logHeader}>
                                <View style={styles.dot} />
                                <Text style={styles.logTime}>{log.formattedTime}</Text>
                            </View>
                            <Text style={styles.incidentTitle}>{log.incidentTitle}</Text>
                            <View style={styles.logContent}>
                                <Text style={styles.statusLabel}>STATUS: {log.status}</Text>
                                <Text style={styles.noteText}>"{log.note}"</Text>
                                <Text style={styles.userText}>— {log.user}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="history" size={64} color={theme.colors.textMuted} />
                        <Text style={styles.emptyText}>No history available yet.</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
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
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.textSecondary,
        marginTop: 16,
    },
    historyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.lg,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border + '40',
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginRight: 8,
    },
    logTime: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
    },
    incidentTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    logContent: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: theme.roundness.md,
    },
    statusLabel: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    noteText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
    userText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 8,
        textAlign: 'right',
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textMuted,
        marginTop: 16,
    },
});

export default IncidentHistoryScreen;

