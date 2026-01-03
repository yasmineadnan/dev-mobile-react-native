import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

import useStore from '../../store/useStore';
import { FirebaseService } from '../../services/firebaseService';

const NewIncidentScreen = ({ onCancel, onSubmit }) => {
    const { profile } = useStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [department, setDepartment] = useState(profile?.department || '');
    const [office, setOffice] = useState('');
    const [area, setArea] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !description || !category) {
            alert('Please fill in at least the title, category, and description.');
            return;
        }

        setLoading(true);
        try {
            await FirebaseService.createIncident({
                title,
                description,
                category,
                priority: severity,
                department: department || 'Not specified',
                office: office || 'Not specified',
                area: area || 'Not specified',
                reporterId: auth.currentUser?.uid,
                reporterName: profile?.fullName || 'Unknown Reporter',
            });

            alert('Incident reported successfully!');
            onSubmit(); // Trigger navigation/callback
        } catch (error) {
            console.error("Error submitting incident:", error);
            alert('Failed to submit incident. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onCancel}>
                    <Text style={styles.headerActionText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Incident</Text>
                <TouchableOpacity>
                    <Text style={styles.headerDraftText}>Draft</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Core Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="info" size={20} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>CORE DETAILS</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Incident Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Water Leak in Hallway B"
                            placeholderTextColor={theme.colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => {
                                const categories = ['Safety', 'Maintenance', 'Security', 'IT Issue'];
                                const selected = categories[Math.floor(Math.random() * categories.length)];
                                setCategory(selected);
                            }}
                        >
                            <Text style={category ? styles.selectorText : styles.placeholderText}>
                                {category || 'Select Category'}
                            </Text>
                            <MaterialIcons name="expand-more" size={24} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Severity / Priority</Text>
                        <View style={styles.severityContainer}>
                            {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.severityBtn,
                                        severity === level && {
                                            backgroundColor: getSeverityColor(level),
                                            borderColor: getSeverityColor(level)
                                        }
                                    ]}
                                    onPress={() => setSeverity(level)}
                                >
                                    <Text style={[
                                        styles.severityBtnText,
                                        severity === level && { color: theme.colors.black, fontWeight: 'bold' }
                                    ]}>
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* What Happened Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="description" size={20} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>WHAT HAPPENED?</Text>
                    </View>

                    <TextInput
                        style={styles.textArea}
                        placeholder="Provide a detailed description of the incident, including who was involved and immediate actions taken..."
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.divider} />

                {/* Location Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>LOCATION</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Department</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => {
                                const depts = ['Facilities', 'IT', 'Security', 'HR', 'Operations'];
                                const selected = depts[Math.floor(Math.random() * depts.length)];
                                setDepartment(selected);
                            }}
                        >
                            <Text style={department ? styles.selectorText : styles.placeholderText}>
                                {department || 'Select Department'}
                            </Text>
                            <MaterialIcons name="expand-more" size={24} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.grid}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Office Number</Text>
                            <TouchableOpacity style={styles.selector}>
                                <Text style={office ? styles.selectorText : styles.placeholderText} numberOfLines={1}>
                                    {office || 'Select Office'}
                                </Text>
                                <MaterialIcons name="expand-more" size={20} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Specific Area</Text>
                            <TouchableOpacity style={styles.selector}>
                                <Text style={area ? styles.selectorText : styles.placeholderText} numberOfLines={1}>
                                    {area || 'Select Area'}
                                </Text>
                                <MaterialIcons name="expand-more" size={20} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Evidence Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="photo-camera" size={20} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>EVIDENCE</Text>
                    </View>

                    <View style={styles.evidenceGrid}>
                        <TouchableOpacity style={styles.addMediaBtn}>
                            <View style={styles.addIconBg}>
                                <MaterialIcons name="add" size={24} color={theme.colors.textMuted} />
                            </View>
                            <Text style={styles.addMediaText}>Add Media</Text>
                        </TouchableOpacity>

                        <View style={styles.mediaPreview}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1542013936693-88463832181d?q=80&w=200' }}
                                style={styles.mediaImage}
                            />
                            <TouchableOpacity style={styles.removeMediaBtn}>
                                <MaterialIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mediaPreview}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=200' }}
                                style={styles.mediaImage}
                            />
                            <TouchableOpacity style={styles.removeMediaBtn}>
                                <MaterialIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Spacer for bottom footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.black} />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>Submit Incident</Text>
                            <MaterialIcons name="send" size={20} color={theme.colors.black} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const getSeverityColor = (level) => {
    switch (level) {
        case 'Critical': return '#ef4444'; // Red
        case 'High': return '#f59e0b'; // Amber
        case 'Medium': return theme.colors.primary; // Greenish/Brand
        case 'Low': return '#64748b'; // Slate
        default: return theme.colors.border;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
    },
    headerActionText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerDraftText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '500',
    },
    scrollContent: {
        paddingTop: theme.spacing.xl,
    },
    section: {
        paddingHorizontal: theme.spacing.lg,
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    severityContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    severityBtn: {
        flex: 1,
        height: 48,
        borderRadius: theme.roundness.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    severityBtnText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.lg,
        height: 56,
        paddingHorizontal: theme.spacing.md,
        color: theme.colors.text,
        fontSize: 16,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.lg,
        height: 56,
        paddingHorizontal: theme.spacing.md,
    },
    selectorText: {
        color: theme.colors.text,
        fontSize: 16,
    },
    placeholderText: {
        color: theme.colors.textMuted,
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        opacity: 0.5,
        marginVertical: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
    },
    textArea: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.lg,
        minHeight: 140,
        padding: theme.spacing.md,
        color: theme.colors.text,
        fontSize: 16,
        lineHeight: 24,
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
    },
    evidenceGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    addMediaBtn: {
        flex: 1,
        aspectSquare: 1,
        borderRadius: theme.roundness.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        backgroundColor: 'rgba(255,255,255,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    addIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addMediaText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '600',
    },
    mediaPreview: {
        flex: 1,
        aspectSquare: 1,
        borderRadius: theme.roundness.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
    },
    removeMediaBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: theme.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 32 : theme.spacing.lg,
    },
    submitBtn: {
        backgroundColor: theme.colors.primary,
        height: 52,
        borderRadius: theme.roundness.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    submitBtnText: {
        color: theme.colors.black,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default NewIncidentScreen;

