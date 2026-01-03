import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit,
    getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/config';

export const FirebaseService = {
    // User Management
    async getUserProfile(uid) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc.exists() ? userDoc.data() : null;
    },

    async updateUserProfile(uid, data) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
    },

    subscribeToAllUsers(callback, onError) {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(users);
        }, onError);
    },


    // Incident Management
    async createIncident(incidentData) {
        const docRef = await addDoc(collection(db, 'incidents'), {
            ...incidentData,
            images: [], // Images disabled for now
            status: 'Open',
            statusHistory: [{
                status: 'Open',
                timestamp: new Date().toISOString(),
                note: 'Incident reported'
            }],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    },

    subscribeToUserIncidents(uid, callback, onError) {
        const q = query(
            collection(db, 'incidents'),
            where('reporterId', '==', uid),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(incidents);
        }, onError);
    },

    subscribeToResponderAssignments(uid, callback, onError) {
        const q = query(
            collection(db, 'incidents'),
            where('assignedTo', '==', uid),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(incidents);
        }, onError);
    },

    subscribeToAllIncidents(callback, onError) {
        const q = query(
            collection(db, 'incidents'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(incidents);
        }, onError);
    },

    subscribeToUnassignedIncidents(callback, onError) {
        // Query incidents that aren't assigned yet
        // In Firestore, checking for field non-existence is tricky, 
        // but we can query by status 'Open' which usually means unassigned
        const q = query(
            collection(db, 'incidents'),
            where('status', 'in', ['Open', 'Pending Review']),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(inc => !inc.assignedTo); // Double check on client side
            callback(incidents);
        }, onError);
    },

    subscribeToRecentIncidents(limitCount = 5, callback, onError) {
        const q = query(
            collection(db, 'incidents'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(incidents);
        }, onError);
    },

    // Notifications
    subscribeToNotifications(uid, callback, onError) {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(notifications);
        }, onError);
    },

    async markNotificationRead(id) {
        await updateDoc(doc(db, 'notifications', id), { read: true });
    },

    async addNotification(userId, notification) {
        await addDoc(collection(db, 'notifications'), {
            userId,
            ...notification,
            read: false,
            createdAt: serverTimestamp(),
        });
    },

    async seedTestNotifications(userId) {
        const testNotifications = [
            {
                title: 'Incident Accepted',
                message: 'Your report #INC-823 has been accepted by Facilities.',
                type: 'check-circle',
                iconColor: '#10b981',
                iconBg: 'rgba(16, 185, 129, 0.15)',
            },
            {
                title: 'Safety Alert',
                message: 'New safety protocols have been updated for Zone 4.',
                type: 'warning',
                iconColor: '#f59e0b',
                iconBg: 'rgba(245, 158, 11, 0.15)',
            },
            {
                title: 'Comment on Incident',
                message: 'Mike from Maintenance commented on your report.',
                type: 'comment',
                iconColor: '#3b82f6',
                iconBg: 'rgba(59, 130, 246, 0.15)',
            }
        ];

        for (const noti of testNotifications) {
            await this.addNotification(userId, noti);
        }
    },

    // Activity Log / Comments
    async addIncidentUpdate(incidentId, update) {
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);
        if (incidentSnap.exists()) {
            const history = incidentSnap.data().statusHistory || [];
            await updateDoc(incidentRef, {
                statusHistory: [...history, { ...update, timestamp: new Date().toISOString() }],
                updatedAt: serverTimestamp()
            });
        }
    },

    // Push Notifications (Cloud Messaging)
    async savePushToken(uid, token) {
        await updateDoc(doc(db, 'users', uid), {
            pushToken: token,
            updatedAt: serverTimestamp()
        });
    },

    async updateIncidentStatus(incidentId, newStatus, note, user) {
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);
        if (incidentSnap.exists()) {
            const history = incidentSnap.data().statusHistory || [];
            await updateDoc(incidentRef, {
                status: newStatus,
                statusHistory: [...history, {
                    status: newStatus,
                    note: note || `Status changed to ${newStatus}`,
                    user: user || 'System',
                    timestamp: new Date().toISOString()
                }],
                updatedAt: serverTimestamp()
            });
        }
    },

    async getIncident(incidentId) {
        const incidentDoc = await getDoc(doc(db, 'incidents', incidentId));
        return incidentDoc.exists() ? { id: incidentDoc.id, ...incidentDoc.data() } : null;
    },

    async getAvailableResponders() {
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'Responder')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status || 'available',
            distance: Math.random() * 2, // Mock distance for now
            skills: doc.data().skills || ['General']
        }));
    },

    async assignResponderToIncident(incidentId, responderId, responderName, responderRole) {
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);

        if (incidentSnap.exists()) {
            const history = incidentSnap.data().statusHistory || [];
            await updateDoc(incidentRef, {
                assignedTo: responderId,
                assignedToName: responderName,
                assignedToRole: responderRole,
                status: 'In Progress',
                statusHistory: [...history, {
                    status: 'In Progress',
                    note: `Assigned to ${responderName}`,
                    user: 'Reviewer',
                    timestamp: new Date().toISOString()
                }],
                updatedAt: serverTimestamp()
            });
        }
    },

    async approveIncident(incidentId, reviewerName) {
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);

        if (incidentSnap.exists()) {
            const history = incidentSnap.data().statusHistory || [];
            await updateDoc(incidentRef, {
                status: 'Approved',
                reviewedBy: reviewerName,
                reviewedAt: serverTimestamp(),
                statusHistory: [...history, {
                    status: 'Approved',
                    note: `Incident approved by ${reviewerName}`,
                    user: reviewerName,
                    timestamp: new Date().toISOString()
                }],
                updatedAt: serverTimestamp()
            });
        }
    },

    async rejectIncident(incidentId, reason, reviewerName) {
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);

        if (incidentSnap.exists()) {
            const history = incidentSnap.data().statusHistory || [];
            await updateDoc(incidentRef, {
                status: 'Rejected',
                rejectionReason: reason,
                reviewedBy: reviewerName,
                reviewedAt: serverTimestamp(),
                statusHistory: [...history, {
                    status: 'Rejected',
                    note: `Incident rejected: ${reason}`,
                    user: reviewerName,
                    timestamp: new Date().toISOString()
                }],
                updatedAt: serverTimestamp()
            });
        }
    },

    async updateIncidentPriority(incidentId, newPriority) {
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);

        if (incidentSnap.exists()) {
            const history = incidentSnap.data().statusHistory || [];
            const oldPriority = incidentSnap.data().priority || 'Medium';
            await updateDoc(incidentRef, {
                priority: newPriority,
                statusHistory: [...history, {
                    status: incidentSnap.data().status,
                    note: `Priority changed from ${oldPriority} to ${newPriority}`,
                    user: 'Reviewer',
                    timestamp: new Date().toISOString()
                }],
                updatedAt: serverTimestamp()
            });
        }
    },

    // Messaging
    subscribeToIncidentMessages(incidentId, callback, onError) {
        const messagesRef = collection(db, 'incidents', incidentId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(messages);
        }, onError);
    },

    async sendMessage(incidentId, message, userId, userName, userRole) {
        const messagesRef = collection(db, 'incidents', incidentId, 'messages');
        await addDoc(messagesRef, {
            message,
            userId,
            userName,
            userRole,
            type: 'user',
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
        });
    },

    async addSystemMessage(incidentId, message) {
        const messagesRef = collection(db, 'incidents', incidentId, 'messages');
        await addDoc(messagesRef, {
            message,
            type: 'system',
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
        });
    },

    // Analytics
    async getAnalytics(dateRange) {
        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        switch (dateRange) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Query incidents
        const incidentsRef = collection(db, 'incidents');
        const q = query(incidentsRef, where('createdAt', '>=', startDate));
        const snapshot = await getDocs(q);

        const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calculate KPIs
        const total = incidents.length;
        const resolved = incidents.filter(i => i.status === 'Resolved').length;

        // Calculate avg resolution time
        const resolvedIncidents = incidents.filter(i => i.status === 'Resolved' && i.resolvedAt);
        let avgTimeMs = 0;
        if (resolvedIncidents.length > 0) {
            avgTimeMs = resolvedIncidents.reduce((sum, inc) => {
                const created = inc.createdAt?.toDate ? inc.createdAt.toDate() : new Date(inc.createdAt);
                const resolved = inc.resolvedAt?.toDate ? inc.resolvedAt.toDate() : new Date(inc.resolvedAt);
                return sum + (resolved - created);
            }, 0) / resolvedIncidents.length;
        }
        const avgTimeHours = Math.round(avgTimeMs / (1000 * 60 * 60));
        const avgTimeMinutes = Math.round((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));
        const avgTime = `${avgTimeHours}h ${avgTimeMinutes}m`;

        // Issue types breakdown
        const categoryCount = {};
        incidents.forEach(inc => {
            categoryCount[inc.category] = (categoryCount[inc.category] || 0) + 1;
        });

        const issueTypes = [
            { name: 'Safety', icon: 'warning', color: '#ef4444', count: categoryCount['Safety Incident'] || 0 },
            { name: 'Technical', icon: 'build', color: '#3b82f6', count: categoryCount['Technical Issue'] || 0 },
            { name: 'Workplace', icon: 'desk', color: '#f59e0b', count: categoryCount['Workplace Issue'] || 0 },
            { name: 'Public', icon: 'public', color: '#13ec5b', count: categoryCount['Public Concern'] || 0 },
        ].map(type => ({
            ...type,
            percentage: total > 0 ? Math.round((type.count / total) * 100) : 0
        }));

        // Top responders
        const responderStats = {};
        incidents.forEach(inc => {
            if (inc.assignedTo) {
                if (!responderStats[inc.assignedTo]) {
                    responderStats[inc.assignedTo] = {
                        name: inc.assignedToName || 'Unknown',
                        tickets: 0,
                        resolved: 0
                    };
                }
                responderStats[inc.assignedTo].tickets++;
                if (inc.status === 'Resolved') {
                    responderStats[inc.assignedTo].resolved++;
                }
            }
        });

        const topResponders = Object.entries(responderStats)
            .map(([id, stats]) => ({
                id,
                name: stats.name,
                tickets: stats.tickets,
                efficiency: Math.round((stats.resolved / stats.tickets) * 100),
                avatar: `https://i.pravatar.cc/100?u=${id}`,
                rating: stats.resolved / stats.tickets > 0.95 ? 'High' : 'Good',
                ratingLevel: stats.resolved / stats.tickets > 0.95 ? 3 : 2
            }))
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 5);

        // Trend data (simple count by day)
        const trendData = Array(7).fill(0);
        incidents.forEach(inc => {
            const created = inc.createdAt?.toDate ? inc.createdAt.toDate() : new Date(inc.createdAt);
            const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            if (daysDiff < 7) {
                trendData[6 - daysDiff]++;
            }
        });

        return {
            total,
            totalChange: 12, // Mock percentage change
            resolved,
            resolvedChange: 5,
            avgTime,
            avgTimeChange: 8,
            issueTypes,
            topResponders,
            trendData
        };
    },
    // Category Management
    subscribeToCategories(callback, onError) {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(categories);
        }, onError);
    },

    async addCategory(categoryData) {
        await addDoc(collection(db, 'categories'), {
            ...categoryData,
            subcategories: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    async updateCategory(categoryId, data) {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async addSubcategory(categoryId, subcategoryName) {
        const categoryRef = doc(db, 'categories', categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (categorySnap.exists()) {
            const currentSubcategories = categorySnap.data().subcategories || [];
            await updateDoc(categoryRef, {
                subcategories: [...currentSubcategories, { name: subcategoryName, active: true }],
                updatedAt: serverTimestamp()
            });
        }
    },

    async renameSubcategory(categoryId, oldName, newName) {
        const categoryRef = doc(db, 'categories', categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (categorySnap.exists()) {
            const currentSubcategories = categorySnap.data().subcategories || [];
            const updatedSubcategories = currentSubcategories.map(sub => {
                if (sub.name === oldName) {
                    return { ...sub, name: newName };
                }
                return sub;
            });

            await updateDoc(categoryRef, {
                subcategories: updatedSubcategories,
                updatedAt: serverTimestamp()
            });
            await updateDoc(categoryRef, {
                subcategories: updatedSubcategories,
                updatedAt: serverTimestamp()
            });
        }
    },

    async deleteSubcategory(categoryId, subcategoryName) {
        const categoryRef = doc(db, 'categories', categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (categorySnap.exists()) {
            const currentSubcategories = categorySnap.data().subcategories || [];
            const updatedSubcategories = currentSubcategories.filter(sub => sub.name !== subcategoryName);

            await updateDoc(categoryRef, {
                subcategories: updatedSubcategories,
                updatedAt: serverTimestamp()
            });
        }
    },

    async seedCategories() {
        const categories = [
            {
                name: 'Safety',
                priority: 'High',
                icon: 'security',
                color: 'red',
                status: 'Active',
                subcategories: [
                    { name: 'Slip, Trip & Fall', active: true },
                    { name: 'Chemical Spill', active: true },
                    { name: 'Fire Hazard', active: true }
                ]
            },
            {
                name: 'IT Infrastructure',
                priority: 'Normal',
                icon: 'dns',
                color: 'blue',
                status: 'Active',
                subcategories: [
                    { name: 'Server Outage', active: true },
                    { name: 'Network Issues', active: true },
                    { name: 'Software Access', active: true }
                ]
            },
            {
                name: 'Workplace',
                priority: 'Critical',
                icon: 'apartment',
                color: 'orange',
                status: 'Active',
                subcategories: [
                    { name: 'Lighting Issues', active: true },
                    { name: 'Desk/Chair Repair', active: true },
                    { name: 'Meeting Room Equipment', active: true }
                ]
            },
            {
                name: 'Public Facilities',
                priority: 'Low',
                icon: 'public',
                color: 'gray',
                status: 'Archived',
                subcategories: [
                    { name: 'Restrooms', active: true },
                    { name: 'Parking Lot', active: true },
                    { name: 'Water Fountain', active: true }
                ]
            }
        ];

        const existingQuery = query(collection(db, 'categories'));
        const querySnapshot = await getDocs(existingQuery);
        const existingCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        for (const cat of categories) {
            const match = existingCategories.find(c => c.name === cat.name);
            if (match) {
                // Check if any default subcategories are missing
                const currentSubcats = match.subcategories || [];
                const missingSubcats = cat.subcategories.filter(defSub =>
                    !currentSubcats.some(currSub => currSub.name === defSub.name)
                );

                if (missingSubcats.length > 0) {
                    await this.updateCategory(match.id, {
                        subcategories: [...currentSubcats, ...missingSubcats]
                    });
                }
            } else {
                // If doesn't exist, Create
                await this.addCategory(cat);
            }
        }
    }
};
