import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const LoginScreen = ({ onSignUp, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please check your credentials.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(err.message || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.formContainer}>
                        {/* Header/Branding */}
                        <View style={styles.header}>
                            <View style={styles.logoBadge}>
                                <MaterialIcons name="security" size={40} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>
                                Please sign in to continue reporting incidents and managing safety protocols.
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email Field */}
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
                                <MaterialIcons
                                    name="mail"
                                    size={24}
                                    color={theme.colors.textSecondary}
                                    style={styles.inputIcon}
                                />
                            </View>

                            {/* Password Field */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.inputIcon}
                                >
                                    <MaterialIcons
                                        name={showPassword ? "visibility" : "visibility-off"}
                                        size={24}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Forgot Password */}
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* Error Message */}
                            {error ? (
                                <View style={styles.errorWrapper}>
                                    <MaterialIcons name="error" size={16} color="#ef4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.background} />
                                ) : (
                                    <>
                                        <Text style={styles.loginButtonText}>LOGIN</Text>
                                        <MaterialIcons name="login" size={20} color={theme.colors.background} />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Biometric Login */}
                            <View style={styles.biometricContainer}>
                                <View style={styles.dividerWrapper}>
                                    <View style={styles.divider} />
                                    <Text style={styles.dividerText}>OR LOGIN WITH</Text>
                                    <View style={styles.divider} />
                                </View>

                                <TouchableOpacity style={styles.biometricButton}>
                                    <MaterialIcons name="fingerprint" size={32} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Don't have an account?{' '}
                                <Text style={styles.signUpLink} onPress={onSignUp}>Sign Up</Text>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    backButton: {
        padding: theme.spacing.md,
        marginTop: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logoBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.md,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        height: 56,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 16,
        height: '100%',
        textAlign: 'left',
    },
    inputIcon: {
        marginLeft: theme.spacing.sm,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.xl,
    },
    forgotPasswordText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.roundness.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonText: {
        color: theme.colors.background,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginRight: theme.spacing.sm,
    },
    errorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
        width: '100%',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
    },
    biometricContainer: {
        alignItems: 'center',
        marginTop: theme.spacing.xxl,
    },
    dividerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
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
    },
    biometricButton: {
        width: 64,
        height: 64,
        borderRadius: theme.roundness.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    signUpLink: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
});

export default LoginScreen;

