import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    FlatList,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { FirebaseService } from '../../services/firebaseService';

const CategoriesScreen = ({ onNavPress }) => {
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [editingSubcategory, setEditingSubcategory] = useState(null); // { categoryId, name }
    const [targetCategoryId, setTargetCategoryId] = useState(null);

    const filters = ['All', 'Active', 'Archived', 'Drafts'];

    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToCategories(
            (data) => {
                setCategories(data);
                setLoading(false);
                // Smart seed: Check and populate defaults if missing
                if (!loading) {
                    FirebaseService.seedCategories();
                }
            },
            (error) => {
                console.error("Error fetching categories:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const toggleExpand = (id) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };

    const handleAddPress = (categoryId) => {
        setTargetCategoryId(categoryId);
        setEditingSubcategory(null);
        setInputValue('');
        setModalVisible(true);
    };

    const handleEditPress = (categoryId, subName) => {
        setTargetCategoryId(categoryId);
        setEditingSubcategory({ categoryId, name: subName });
        setInputValue(subName);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!inputValue.trim()) return;

        try {
            if (editingSubcategory) {
                // Edit existing
                await FirebaseService.renameSubcategory(targetCategoryId, editingSubcategory.name, inputValue.trim());
            } else {
                // Add new
                await FirebaseService.addSubcategory(targetCategoryId, inputValue.trim());
            }
            setModalVisible(false);
        } catch (error) {
            console.error("Error saving subcategory:", error);
            alert("Failed to save subcategory");
        }
    };

    const handleDeletePress = (categoryId, subName) => {
        // Platform-independent confirmation (works on Web too via window.confirm if needed, but Alert is standard RN)
        if (Platform.OS === 'web') {
            if (confirm(`Are you sure you want to delete "${subName}"?`)) {
                FirebaseService.deleteSubcategory(categoryId, subName).catch(err => console.error("Deletion failed:", err));
            }
        } else {
            const { Alert } = require('react-native');
            Alert.alert(
                "Delete Sub-category",
                `Are you sure you want to delete "${subName}"?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => FirebaseService.deleteSubcategory(categoryId, subName)
                    }
                ]
            );
        }
    };

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'All' || cat.status === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const CategoryItem = ({ item }) => {
        const isExpanded = expandedCategory === item.id;
        const subcategories = item.subcategories || [];

        return (
            <View style={styles.categoryCard}>
                <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerLeft}>
                        <MaterialIcons name="drag-indicator" size={20} color="#5a7a65" />
                        <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                            <MaterialIcons name={item.icon || 'category'} size={24} color={item.color || theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.categoryName}>{item.name}</Text>
                            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                                {item.priority} Priority
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        {item.status === 'Active' && <View style={styles.activeDot} />}
                        <MaterialIcons
                            name={isExpanded ? "expand-less" : "expand-more"}
                            size={24}
                            color="#9db9a6"
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.subcategoryList}>
                        {subcategories.map((sub, index) => (
                            <View key={index} style={styles.subcategoryItem}>
                                <Text style={styles.subcategoryText}>{sub.name}</Text>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity onPress={() => handleEditPress(item.id, sub.name)} style={styles.actionBtn}>
                                        <MaterialIcons name="edit" size={18} color="#5a7a65" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeletePress(item.id, sub.name)} style={styles.actionBtn}>
                                        <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                        {subcategories.length === 0 && (
                            <Text style={styles.emptySubtext}>No sub-categories defined</Text>
                        )}
                        <TouchableOpacity style={styles.addSubBtn} onPress={() => handleAddPress(item.id)}>
                            <MaterialIcons name="add" size={18} color={theme.colors.primary} />
                            <Text style={styles.addSubText}>Add Sub-category</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return '#ef4444';
            case 'Critical': return '#f97316';
            case 'Low': return '#9ca3af';
            default: return '#3b82f6';
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity>
                        <Text style={styles.editBtn}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <MaterialIcons name="settings" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.title}>Categories</Text>
            </View>

            {/* Search & Filter */}
            <View style={styles.controls}>
                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color="#9db9a6" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search categories..."
                        placeholderTextColor="#9db9a6"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {filters.map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, selectedFilter === filter && styles.activeFilter]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <ScrollView contentContainerStyle={styles.listContent}>
                {filteredCategories.map(item => (
                    <CategoryItem key={item.id} item={item} />
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab}>
                <MaterialIcons name="add" size={28} color="#102216" />
            </TouchableOpacity>


            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('admin-user-management')}>
                    <MaterialIcons name="group" size={24} color="#6b7280" />
                    <Text style={styles.navText}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavPress('admin-categories')}>
                    <View style={styles.activeNavIcon}>
                        <MaterialIcons name="category" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.activeNavText}>Categories</Text>
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

            {/* Input Modal */}
            {modalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingSubcategory ? 'Edit Sub-category' : 'Add Sub-category'}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter name"
                            placeholderTextColor="#9ca3af"
                            value={inputValue}
                            onChangeText={setInputValue}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveBtnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102216',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 12,
        backgroundColor: '#102216',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    editBtn: {
        color: '#9db9a6',
        fontSize: 14,
        fontWeight: '500',
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    controls: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#102216',
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e3626',
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
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
    filters: {
        gap: 8,
        paddingBottom: 8,
    },
    filterChip: {
        height: 32,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#28392e',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3b5443',
    },
    activeFilter: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
    },
    activeFilterText: {
        color: '#102216',
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 12,
    },
    categoryCard: {
        backgroundColor: '#162b1e',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3b5443',
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    priorityText: {
        fontSize: 12,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    subcategoryList: {
        backgroundColor: 'rgba(17, 24, 19, 0.5)',
        paddingTop: 0,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    subcategoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginLeft: 52, // Indent
        borderLeftWidth: 1,
        borderLeftColor: '#3b5443',
        marginTop: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    subcategoryText: {
        color: '#9db9a6',
        fontSize: 14,
        flex: 1, // Allow text to take available space
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
    },
    addSubBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 64,
        marginTop: 12,
        paddingVertical: 4,
    },
    addSubText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    emptySubtext: {
        color: '#5a7a65',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 16, // Squircle
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 6,
        zIndex: 20,
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
        zIndex: 30,
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
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#162b1e',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#0d1c12',
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 12,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    cancelBtn: {
        backgroundColor: 'transparent',
    },
    cancelBtnText: {
        color: '#9ca3af',
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: theme.colors.primary,
    },
    saveBtnText: {
        color: '#0d1c12',
        fontWeight: 'bold',
    },
});

export default CategoriesScreen;

