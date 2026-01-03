import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Image,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { FirebaseService } from '../services/firebaseService';
import useStore from '../store/useStore';

const IncidentMessagesScreen = ({ incidentId, onBack, onNavPress }) => {
    const { profile, user } = useStore();
    const [incident, setIncident] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef();

    useEffect(() => {
        loadIncidentData();
        const unsubscribe = FirebaseService.subscribeToIncidentMessages(
            incidentId,
            (msgs) => {
                setMessages(msgs);
                setLoading(false);
            },
            (error) => {
                console.error('Error loading messages:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [incidentId]);

    const loadIncidentData = async () => {
        try {
            const data = await FirebaseService.getIncident(incidentId);
            setIncident(data);
        } catch (error) {
            console.error('Error loading incident:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || sending) return;

        setSending(true);
        try {
            await FirebaseService.sendMessage(
                incidentId,
                messageText.trim(),
                user.uid,
                profile?.fullName || 'Anonymous',
                profile?.role || 'Reporter'
            );
            setMessageText('');
            // Scroll to bottom after sending
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleQuickAction = async (action) => {
        let systemMessage = '';
        switch (action) {
            case 'request-info':
                systemMessage = `${profile?.fullName} requested additional information`;
                break;
            case 'update-status':
                // This could open a status update modal
                return;
            case 'mark-resolved':
                systemMessage = `${profile?.fullName} marked this incident as resolved`;
                await FirebaseService.updateIncidentStatus(incidentId, 'Resolved', 'Marked resolved via messages', profile?.fullName);
                break;
        }

        if (systemMessage) {
            await FirebaseService.addSystemMessage(incidentId, systemMessage);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Reporter': return theme.colors.primary;
            case 'Reviewer': return theme.colors.textSecondary;
            case 'Responder': return '#3b82f6';
            default: return theme.colors.textMuted;
        }
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (hours > 24) {
            return date.toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>#{incident.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.headerSubtitle}>{incident.title}</Text>
                </View>
                <TouchableOpacity style={styles.infoBtn} onPress={() => onBack()}>
                    <MaterialIcons name="info" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Messages Stream */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                >
                    {messages.map((msg, index) => {
                        if (msg.type === 'system') {
                            return (
                                <View key={index} style={styles.systemMessageContainer}>
                                    <View style={styles.systemDivider} />
                                    <Text style={styles.systemMessage}>{msg.message}</Text>
                                </View>
                            );
                        }


                        const isCurrentUser = msg.userId === user.uid;
                        const roleIcon = msg.userRole === 'Reviewer' ? 'admin-panel-settings' : msg.userRole === 'Responder' ? 'support-agent' : 'person';

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.messageBubbleContainer,
                                    isCurrentUser ? styles.messageBubbleContainerRight : styles.messageBubbleContainerLeft
                                ]}
                            >
                                {!isCurrentUser && (
                                    <View style={styles.avatar}>
                                        <MaterialIcons name={roleIcon} size={18} color={theme.colors.textSecondary} />
                                    </View>
                                )}

                                <View style={[styles.messageContent, isCurrentUser && styles.messageContentRight]}>
                                    <View style={[styles.messageHeader, isCurrentUser && styles.messageHeaderRight]}>
                                        <Text style={styles.userName}>{isCurrentUser ? 'Me' : msg.userName}</Text>
                                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(msg.userRole) + '20' }]}>
                                            <Text style={[styles.roleBadgeText, { color: getRoleColor(msg.userRole) }]}>
                                                {msg.userRole?.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.messageBubble,
                                        isCurrentUser ? styles.messageBubbleOwn : styles.messageBubbleOther
                                    ]}>
                                        <Text style={[
                                            styles.messageText,
                                            isCurrentUser && styles.messageTextOwn
                                        ]}>
                                            {msg.message}
                                        </Text>
                                        {msg.imageUrl && (
                                            <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
                                        )}
                                    </View>
                                    <Text style={[styles.messageTime, isCurrentUser && styles.messageTimeRight]}>
                                        {formatTime(msg.timestamp)}
                                    </Text>
                                </View>
                                {isCurrentUser && (
                                    <View style={[styles.avatar, styles.avatarOwn]}>
                                        <MaterialIcons name={roleIcon} size={18} color={theme.colors.primary} />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Quick Actions + Input Area */}
                <View style={styles.inputArea}>
                    {/* Quick Actions */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.quickActions}
                        contentContainerStyle={styles.quickActionsContent}
                    >
                        <TouchableOpacity
                            style={styles.quickActionBtn}
                            onPress={() => handleQuickAction('request-info')}
                        >
                            <Text style={styles.quickActionText}>Request Info</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionBtn}
                            onPress={() => handleQuickAction('update-status')}
                        >
                            <Text style={styles.quickActionText}>Update Status</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionBtn}
                            onPress={() => handleQuickAction('mark-resolved')}
                        >
                            <Text style={styles.quickActionText}>Mark Resolved</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Message Input */}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.attachBtn}>
                            <MaterialIcons name="add-circle" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a comment..."
                            placeholderTextColor={theme.colors.textMuted}
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
                            onPress={handleSendMessage}
                            disabled={!messageText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={theme.colors.background} />
                            ) : (
                                <MaterialIcons name="send" size={20} color={theme.colors.background} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {profile?.role === 'Reviewer' ? (
                    <>
                        <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                        <NavButton icon="assignment-late" label="Incidents" active onPress={() => onNavPress('incoming-incidents')} />
                        <NavButton icon="assignment-ind" label="Assignments" onPress={() => { }} />
                        <NavButton icon="bar-chart" label="Reports" onPress={() => { }} />
                    </>
                ) : (
                    <>
                        <NavButton icon="home" label="Home" onPress={() => onNavPress('home')} />
                        <NavButton icon="assignment" label="Incidents" active onPress={() => onNavPress('my-incidents')} />
                        <NavButton icon="notifications" label="Notifs" onPress={() => onNavPress('notifications')} />
                        <NavButton icon="person" label="Profile" onPress={() => onNavPress('profile')} />
                    </>
                )}
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    infoBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: theme.spacing.lg,
        paddingBottom: 24,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    systemDivider: {
        height: 1,
        width: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8,
    },
    systemMessage: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    messageBubbleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    messageBubbleContainerLeft: {
        justifyContent: 'flex-start',
    },
    messageBubbleContainerRight: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
    },
    avatarOwn: {
        marginRight: 0,
        marginLeft: 12,
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    messageContent: {
        maxWidth: '80%',
        alignItems: 'flex-start',
    },
    messageContentRight: {
        alignItems: 'flex-end',
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        marginLeft: 4,
    },
    messageHeaderRight: {
        marginLeft: 0,
        marginRight: 4,
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    messageBubble: {
        borderRadius: 12,
        padding: 12,
    },
    messageBubbleOwn: {
        backgroundColor: theme.colors.primary,
        borderTopRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: theme.colors.surfaceHighlight,
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text,
    },
    messageTextOwn: {
        color: theme.colors.background,
        fontWeight: '500',
    },
    messageImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 8,
    },
    messageTime: {
        fontSize: 10,
        color: theme.colors.textMuted,
        marginTop: 4,
        marginLeft: 4,
    },
    messageTimeRight: {
        marginLeft: 0,
        marginRight: 4,
    },
    inputArea: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: `${theme.colors.background}F0`,
        paddingTop: 8,
        paddingBottom: 88,
    },
    quickActions: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 12,
    },
    quickActionsContent: {
        gap: 8,
    },
    quickActionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        borderRadius: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    attachBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text,
        maxHeight: 100,
        paddingVertical: 10,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    sendBtnDisabled: {
        opacity: 0.5,
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

export default IncidentMessagesScreen;

