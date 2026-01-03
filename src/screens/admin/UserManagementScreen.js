import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { FirebaseService } from '../../services/firebaseService';

const { width } = Dimensions.get('window');

const UserManagementScreen = ({ onNavPress }) => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All Users');
    const [loading, setLoading] = useState(true);

    const filters = ['All Users', 'Admins', 'Safety Officers', 'Technicians', 'Reporters'];

    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToAllUsers(
            (userData) => {
                setUsers(userData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const filteredUsers = users.filter(user => {
        // Search Filter
        const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Category Filter
        let matchesFilter = true;
        if (selectedFilter === 'Admins') matchesFilter = user.role === 'Admin';
        else if (selectedFilter === 'Safety Officers') matchesFilter = user.role === 'Reviewer'; // Assuming Reviewer = Safety Officer
        else if (selectedFilter === 'Technicians') matchesFilter = user.role === 'Responder'; // Assuming Responder = Technician
        else if (selectedFilter === 'Reporters') matchesFilter = user.role === 'Reporter';

        return matchesSearch && matchesFilter;
    });

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin': return { bg: 'rgba(124, 58, 237, 0.1)', text: '#8b5cf6', border: 'rgba(124, 58, 237, 0.2)' }; // Purple
            case 'Responder': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' }; // Blue
            case 'Reviewer': return { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', border: 'rgba(234, 179, 8, 0.2)' }; // Yellow
            case 'Reporter': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' }; // Green
            default: return { bg: 'rgba(75, 85, 99, 0.1)', text: '#6b7280', border: 'rgba(75, 85, 99, 0.2)' }; // Gray
        }
    };

    const UserCard = ({ user }) => {
        const roleStyle = getRoleColor(user.role);

        return (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {user.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>

                    {/* Info */}
                    <View style={styles.userInfo}>
                        <View style={styles.userHeader}>
                            <Text style={styles.userName} numberOfLines={1}>{user.fullName}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                                <Text style={[styles.roleText, { color: roleStyle.text }]}>{user.role}</Text>
                            </View>
                        </View>
                        <Text style={styles.userEmail} numberOfLines={1}>
                            {user.email} • {user.department || 'General'}
                        </Text>
                    </View>

                    {/* Options */}
                    <TouchableOpacity style={styles.optionsBtn}>
                        <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>User Management</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <MaterialIcons name="add" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={24} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filter Chips */}
            <View>
                <FlatList
                    horizontal
                    data={filters}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.chip,
                                selectedFilter === item ? styles.activeChip : styles.inactiveChip
                            ]}
                            onPress={() => setSelectedFilter(item)}
                        >
                            <Text style={[
                                styles.chipText,
                                selectedFilter === item ? styles.activeChipText : styles.inactiveChipText
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* List Header */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Active Members ({filteredUsers.length})</Text>
                <TouchableOpacity>
                    <Text style={styles.sortBtn}>Sort by: Name</Text>
                </TouchableOpacity>
            </View>

            {/* User List */}
            <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <UserCard user={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('admin-user-management')}>
                    <View style={styles.activeNavIcon}>
                        <MaterialIcons name="group" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.activeNavText}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('admin-categories')}>
                    <MaterialIcons name="category" size={24} color="#6b7280" />
                    <Text style={styles.navText}>Categories</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="bar-chart" size={24} color="#6b7280" />
                    <Text style={styles.navText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('admin-roles-permissions')}>
                    <MaterialIcons name="settings" size={24} color="#6b7280" />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102216', // background-dark
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(246, 248, 246, 0.05)', // slight transparency
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        paddingTop: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#162a1d', // surface-dark
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%',
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 4,
        gap: 8,
    },
    chip: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    inactiveChip: {
        backgroundColor: '#162a1d',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activeChipText: {
        color: '#000',
    },
    inactiveChipText: {
        color: '#d1d5db',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    listTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sortBtn: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // Space for bottom nav
        gap: 12,
    },
    card: {
        backgroundColor: '#162a1d', // surface-dark
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: '#162a1d',
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        marginRight: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        color: '#9ca3af',
    },
    optionsBtn: {
        padding: 4,
        marginRight: -4,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#0d1c12',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 20,
    },
    navItem: {
        alignItems: 'center',
        width: 64,
        gap: 4,
    },
    activeNavIcon: {
        width: 48,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(19, 236, 91, 0.1)', // primary/10
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeNavText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    navText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
    },
});

export default UserManagementScreen;
