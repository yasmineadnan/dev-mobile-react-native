import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const RegisterScreen = ({ onLogin }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [role, setRole] = useState('Reporter');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!agreeTerms) {
            setError('Please agree to the Terms of Service');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save additional user info to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                fullName,
                email,
                role,
                department: 'Not assigned',
                createdAt: new Date().toISOString(),
            });

            // Note: In App.js we will handle the auth state change to navigate
            // but for now we can just suggest logging in or automated transition
            alert('Account created successfully!');
            onLogin();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.headerNav}>
                <TouchableOpacity style={styles.backButton} onPress={onLogin}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Headline */}
                    <View style={styles.headline}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Join to report and manage incidents effectively.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                                <View style={[styles.inputIconWrapper, styles.rightIconBorder]}>
                                    <MaterialIcons name="person" size={24} color={theme.colors.textSecondary} />
                                </View>
                            </View>
                        </View>

                        {/* Email Address */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <View style={[styles.inputIconWrapper, styles.rightIconBorder]}>
                                    <MaterialIcons name="mail" size={24} color={theme.colors.textSecondary} />
                                </View>
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    textAlign="left"
                                />
                                <TouchableOpacity
                                    style={[styles.inputIconWrapper, styles.rightIconBorder]}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <MaterialIcons
                                        name={showPassword ? "visibility" : "visibility-off"}
                                        size={24}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Repeat password"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    textAlign="left"
                                />
                                <TouchableOpacity
                                    style={[styles.inputIconWrapper, styles.rightIconBorder]}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <MaterialIcons
                                        name={showConfirmPassword ? "visibility" : "visibility-off"}
                                        size={24}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Role Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Register as</Text>
                            <View style={styles.roleSelectionRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.roleChip,
                                        role === 'Reporter' && styles.roleChipActive
                                    ]}
                                    onPress={() => setRole('Reporter')}
                                >
                                    <MaterialIcons
                                        name="person"
                                        size={18}
                                        color={role === 'Reporter' ? theme.colors.background : theme.colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.roleChipText,
                                        role === 'Reporter' && styles.roleChipTextActive
                                    ]}>Reporter</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.roleChip,
                                        role === 'Reviewer' && styles.roleChipActive
                                    ]}
                                    onPress={() => setRole('Reviewer')}
                                >
                                    <MaterialIcons
                                        name="verified-user"
                                        size={18}
                                        color={role === 'Reviewer' ? theme.colors.background : theme.colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.roleChipText,
                                        role === 'Reviewer' && styles.roleChipTextActive
                                    ]}>Reviewer</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.roleChip,
                                        role === 'Responder' && styles.roleChipActive
                                    ]}
                                    onPress={() => setRole('Responder')}
                                >
                                    <MaterialIcons
                                        name="medical-services"
                                        size={18}
                                        color={role === 'Responder' ? theme.colors.background : theme.colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.roleChipText,
                                        role === 'Responder' && styles.roleChipTextActive
                                    ]}>Responder</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.roleChip,
                                        role === 'Admin' && styles.roleChipActive
                                    ]}
                                    onPress={() => setRole('Admin')}
                                >
                                    <MaterialIcons
                                        name="admin-panel-settings"
                                        size={18}
                                        color={role === 'Admin' ? theme.colors.background : theme.colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.roleChipText,
                                        role === 'Admin' && styles.roleChipTextActive
                                    ]}>Admin</Text>
                                </TouchableOpacity>
                            </View>

                        </View>

                        {/* Terms Checkbox */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => setAgreeTerms(!agreeTerms)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                agreeTerms && styles.checkboxChecked
                            ]}>
                                {agreeTerms && (
                                    <MaterialIcons name="check" size={16} color={theme.colors.background} />
                                )}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.
                            </Text>
                        </TouchableOpacity>

                        {/* Error Message */}
                        {error ? (
                            <View style={styles.errorWrapper}>
                                <MaterialIcons name="error" size={16} color="#ef4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={theme.colors.background} />
                            ) : (
                                <Text style={styles.registerButtonText}>Register</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerWrapper}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Or register with</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={20} color={theme.colors.text} />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={20} color={theme.colors.text} />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Already have an account?{' '}
                                <Text style={styles.loginLink} onPress={onLogin}>Log In</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        height: 60,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },
    headline: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'left',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: theme.spacing.sm,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.lg,
        height: 56,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 16,
        paddingHorizontal: theme.spacing.md,
        height: '100%',
        textAlign: 'left',
    },
    inputIconWrapper: {
        paddingHorizontal: theme.spacing.md,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    rightIconBorder: {
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.border,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: theme.spacing.md,
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    termsText: {
        flex: 1,
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    link: {
        color: theme.colors.primary,
    },
    registerButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.roundness.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    registerButtonText: {
        color: theme.colors.background,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    errorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
    },
    dividerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },
    dividerText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginHorizontal: theme.spacing.md,
        textTransform: 'none',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: theme.spacing.xl,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        borderRadius: theme.roundness.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    socialButtonText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    loginLink: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    roleSelectionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 4,
    },
    roleChip: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.lg,
        height: 48,
        gap: 8,
    },
    roleChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    roleChipText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    roleChipTextActive: {
        color: theme.colors.background,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;

