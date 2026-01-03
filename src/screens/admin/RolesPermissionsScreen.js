import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const RolesPermissionsScreen = ({ onNavPress }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const ActiveRoleItem = ({ icon, color, label, meta, count, isSystem }) => (
        <TouchableOpacity style={styles.roleItem}>
            <View style={styles.roleItemContent}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <MaterialIcons name={icon} size={24} color={color} />
                    {isSystem && (
                        <View style={styles.activeIndicator}>
                            <View style={styles.activeDot} />
                        </View>
                    )}
                </View>
                <View style={styles.roleInfo}>
                    <View style={styles.roleHeader}>
                        <Text style={styles.roleName} numberOfLines={1}>{label}</Text>
                        {isSystem && (
                            <View style={[styles.systemBadge, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '20' }]}>
                                <Text style={styles.systemBadgeText}>System</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.roleMeta} numberOfLines={1}>{meta} • {count} Users</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#6b7280" style={styles.chevron} />
            </View>
        </TouchableOpacity>
    );

    const CustomRoleItem = ({ icon, label, meta, count }) => (
        <TouchableOpacity style={styles.roleItem}>
            <View style={styles.roleItemContent}>
                <View style={styles.customIconContainer}>
                    <MaterialIcons name={icon} size={24} color="#9ca3af" />
                </View>
                <View style={styles.roleInfo}>
                    <Text style={styles.roleName} numberOfLines={1}>{label}</Text>
                    <Text style={styles.roleMeta} numberOfLines={1}>{meta} • {count} Users</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#6b7280" style={styles.chevron} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => onNavPress('admin-user-management')}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Roles & Permissions</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <MaterialIcons name="add" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={24} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search roles..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Active Roles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Active Roles</Text>
                    <View style={styles.list}>
                        <ActiveRoleItem
                            icon="security"
                            color="#13ec5b"
                            label="Administrator"
                            meta="Full Access"
                            count="3"
                            isSystem
                        />
                        <ActiveRoleItem
                            icon="medical-services"
                            color="#3b82f6"
                            label="Responder"
                            meta="Edit Status, Comment"
                            count="12"
                        />
                        <ActiveRoleItem
                            icon="rate-review"
                            color="#f97316"
                            label="Reviewer"
                            meta="Approve, Reject"
                            count="5"
                        />
                        <ActiveRoleItem
                            icon="report"
                            color="#a855f7"
                            label="Reporter"
                            meta="Submit Only"
                            count="84"
                        />
                    </View>
                </View>

                <View style={{ height: 24 }} />

                {/* Custom Roles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Custom Roles</Text>
                    <View style={styles.list}>
                        <CustomRoleItem
                            icon="analytics"
                            label="Analytics Viewer"
                            meta="View Reports, Export"
                            count="2"
                        />
                        <CustomRoleItem
                            icon="explore"
                            label="Field Agent"
                            meta="Submit, Geo-tagging"
                            count="24"
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('admin-user-management')}>
                    <MaterialIcons name="group" size={24} color="#6b7280" />
                    <Text style={styles.navText}>Users</Text>
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
                    <View style={styles.activeNavIcon}>
                        <MaterialIcons name="settings" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.activeNavText}>Settings</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102216',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12, // Increased padding
        backgroundColor: 'rgba(246, 248, 246, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: Platform.OS === 'android' ? 40 : 12, // Added top padding for Android status bar
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#162a1d', // surface-dark
        height: 48, // Standard height
        borderRadius: 12,
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
    section: {
        gap: 4,
    },
    sectionTitle: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af', // text-secondary
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    list: {
        gap: 4,
    },
    roleItem: {
        width: '100%',
    },
    roleItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 8,
        borderRadius: 12,
        backgroundColor: 'transparent', // Default transparent
        // Hover effect would be handled by TouchableOpacity
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    customIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#162a1d', // surface-dark
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#102216', // background-dark
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22c55e', // green-500
    },
    roleInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    roleName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    systemBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
    },
    systemBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    roleMeta: {
        fontSize: 14,
        color: '#9ca3af', // text-secondary
    },
    chevron: {
        opacity: 0.5,
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
        backgroundColor: 'rgba(19, 236, 91, 0.05)', // Even lighter primary
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

export default RolesPermissionsScreen;
