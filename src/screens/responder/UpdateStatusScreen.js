import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { FirebaseService } from '../../services/firebaseService';
import { auth } from '../../firebase/config';

const UpdateStatusScreen = ({ incidentId, onBack, onSave }) => {
    const [status, setStatus] = useState('In Progress');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [incident, setIncident] = useState(null);

    React.useEffect(() => {
        if (incidentId) {
            const fetchIncident = async () => {
                const data = await FirebaseService.getIncident(incidentId);
                if (data) {
                    setIncident(data);
                    setStatus(data.status);
                }
            };
            fetchIncident();
        }
    }, [incidentId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await FirebaseService.updateIncidentStatus(incidentId, status, note, auth.currentUser?.email);
            Alert.alert("Success", "Status updated successfully", [
                { text: "OK", onPress: onSave }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const StatusOption = ({ value, label, subLabel, icon }) => (
        <TouchableOpacity
            style={[
                styles.statusOption,
                status === value && styles.statusOptionActive
            ]}
            onPress={() => setStatus(value)}
            activeOpacity={0.7}
        >
            <View style={[
                styles.radioOuter,
                status === value && styles.radioOuterActive
            ]}>
                {status === value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.statusContent}>
                <Text style={styles.statusLabel}>{label}</Text>
                <Text style={styles.statusSubLabel}>{subLabel}</Text>
            </View>
            {status === value && (
                <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* TopAppBar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Update Status</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text style={styles.saveText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Context Card */}
                    {incident && (
                        <View style={styles.contextCard}>
                            <View style={styles.contextContent}>
                                <View>
                                    <Text style={styles.contextTitle}>Incident #{incident.id?.slice(0, 4)}</Text>
                                    <Text style={styles.contextSubtitle}>{incident.title}</Text>
                                </View>
                                <View style={styles.locationRow}>
                                    <MaterialIcons name="location-on" size={16} color={theme.colors.textMuted} />
                                    <Text style={styles.locationText}>{incident.location || incident.area || 'Unknown Location'}</Text>
                                </View>
                            </View>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1542013936693-88463832181d?q=80&w=200' }}
                                style={styles.thumbnail}
                            />
                        </View>
                    )}

                    {/* Status Headline */}
                    <Text style={styles.sectionHeadline}>Current Status</Text>

                    {/* RadioList */}
                    <View style={styles.optionsList}>
                        <StatusOption
                            value="In Progress"
                            label="In Progress"
                            subLabel="Currently working on the fix"
                            icon="construction"
                        />
                        <StatusOption
                            value="Waiting for Resources"
                            label="Waiting for Resources"
                            subLabel="Parts or team unavailable"
                            icon="inventory-2"
                        />
                        <StatusOption
                            value="Resolved"
                            label="Resolved"
                            subLabel="Issue fixed and verified"
                            icon="check-circle"
                        />
                    </View>

                    {/* Note Headline */}
                    <Text style={styles.sectionHeadline}>Add Note</Text>

                    {/* Note Input */}
                    <View style={styles.noteInputContainer}>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Describe the work performed or resources needed..."
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            textAlignVertical="top"
                            value={note}
                            onChangeText={setNote}
                            maxLength={500}
                        />
                        <View style={styles.noteFooter}>
                            <TouchableOpacity style={styles.addPhotoBtn}>
                                <MaterialIcons name="add-a-photo" size={20} color={theme.colors.textSecondary} />
                                <Text style={styles.addPhotoText}>Add Photo</Text>
                            </TouchableOpacity>
                            <Text style={styles.charCount}>{note.length}/500</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Nav Placeholder (Visual only as requested in HTML design, functional not needed here since it's a modal-like screen) */}
            <View style={styles.bottomNav}>
                <View style={styles.navItem}>
                    <View style={[styles.navIconWrapper, { backgroundColor: 'rgba(19, 236, 91, 0.1)' }]}>
                        <MaterialIcons name="assignment" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.navLabel, { color: theme.colors.primary }]}>Assigned</Text>
                </View>
                <View style={styles.navItem}>
                    <View style={styles.navIconWrapper}>
                        <MaterialIcons name="person" size={24} color={theme.colors.textMuted} />
                    </View>
                    <Text style={styles.navLabel}>Profile</Text>
                </View>
            </View>

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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: theme.colors.background,
    },
    closeBtn: {
        width: 48,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    saveBtn: {
        width: 48,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    saveText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    contextCard: {
        margin: 16,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    contextContent: {
        flex: 1,
        justifyContent: 'center',
        gap: 8,
    },
    contextTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    contextSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    thumbnail: {
        width: 96,
        height: 96,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceHighlight,
    },
    sectionHeadline: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    optionsList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    statusOptionActive: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: theme.colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
    },
    statusContent: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    statusSubLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    noteInputContainer: {
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 16,
    },
    noteInput: {
        minHeight: 120,
        color: theme.colors.text,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 12,
        marginTop: 8,
    },
    addPhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addPhotoText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    charCount: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 20,
        paddingTop: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
        height: 80,
    },
    navItem: {
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

export default UpdateStatusScreen;
