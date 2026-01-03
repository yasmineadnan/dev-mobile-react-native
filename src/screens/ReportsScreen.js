import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Path, Defs, LinearGradient, Stop, G, Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { theme } from '../theme/theme';
import { FirebaseService } from '../services/firebaseService';
import useStore from '../store/useStore';

const ReportsScreen = ({ onNavPress }) => {
    const { profile } = useStore();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d');
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await FirebaseService.getAnalytics(dateRange);
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const DateRangeButton = ({ label, value }) => (
        <TouchableOpacity
            style={[styles.dateBtn, dateRange === value && styles.dateBtnActive]}
            onPress={() => setDateRange(value)}
        >
            <Text style={[styles.dateBtnText, dateRange === value && styles.dateBtnTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const SplineTrendChart = ({ data }) => {
        const [selectedIndex, setSelectedIndex] = useState(data.length - 1);
        const chartHeight = 180;
        const chartWidth = 330;
        const maxVal = Math.max(...data, 5) * 1.2;
        const paddingLeft = 15;
        const paddingRight = 90;
        const step = (chartWidth - paddingLeft - paddingRight) / (data.length - 1);

        const points = data.map((val, i) => ({
            x: paddingLeft + i * step,
            y: chartHeight - (val / maxVal) * chartHeight
        }));

        const getBezierPath = (pts) => {
            if (pts.length < 2) return '';
            let path = `M ${pts[0].x} ${pts[0].y}`;
            for (let i = 0; i < pts.length - 1; i++) {
                const cp1x = pts[i].x + step / 2;
                const cp2x = pts[i + 1].x - step / 2;
                path += ` C ${cp1x} ${pts[i].y}, ${cp2x} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
            }
            return path;
        };

        const splinePath = getBezierPath(points);
        const areaPath = `${splinePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const todayIdx = new Date().getDay();
        const labels = [...days.slice(todayIdx), ...days.slice(0, todayIdx)];

        return (
            <View style={styles.chartContainer}>
                <Svg height={chartHeight + 40} width={chartWidth}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {[0, 0.5, 1].map((p, i) => (
                        <Line
                            key={i}
                            x1={paddingLeft}
                            y1={chartHeight * p}
                            x2={chartWidth - paddingRight}
                            y2={chartHeight * p}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                            strokeDasharray="5,5"
                        />
                    ))}

                    <Path d={areaPath} fill="url(#grad)" />
                    <Path d={splinePath} fill="none" stroke={theme.colors.primary} strokeWidth="3" />

                    {points.map((pt, i) => (
                        <G key={i}>
                            <Circle
                                cx={pt.x}
                                cy={pt.y}
                                r={selectedIndex === i ? 6 : 0}
                                fill="#111418"
                                stroke={theme.colors.primary}
                                strokeWidth="2"
                            />
                            <Rect
                                x={pt.x - step / 2}
                                y={0}
                                width={step}
                                height={chartHeight}
                                fill="transparent"
                                onPress={() => setSelectedIndex(i)}
                            />
                            <SvgText
                                x={pt.x}
                                y={chartHeight + 25}
                                fill={theme.colors.textSecondary}
                                fontSize="10"
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {labels[i]}
                            </SvgText>
                        </G>
                    ))}
                </Svg>
            </View>
        );
    };

    if (loading || !analytics) {
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

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reports</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <MaterialIcons name="tune" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                <View style={styles.dateRangeContainer}>
                    <DateRangeButton label="7 Days" value="7d" />
                    <DateRangeButton label="30 Days" value="30d" />
                    <DateRangeButton label="Month" value="month" />
                    <DateRangeButton label="Year" value="year" />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <MaterialIcons name="description" size={20} color={theme.colors.textSecondary} />
                            <Text style={styles.kpiLabel}>TOTAL</Text>
                        </View>
                        <Text style={styles.kpiValue}>{analytics.total}</Text>
                        <View style={styles.kpiTrend}>
                            <MaterialIcons name="trending-up" size={14} color={theme.colors.primary} />
                            <Text style={styles.kpiTrendText}>+{analytics.totalChange}%</Text>
                            <Text style={styles.kpiTrendLabel}>vs last period</Text>
                        </View>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <MaterialIcons name="check-circle" size={20} color={theme.colors.textSecondary} />
                            <Text style={styles.kpiLabel}>RESOLVED</Text>
                        </View>
                        <Text style={styles.kpiValue}>{analytics.resolved}</Text>
                        <View style={styles.kpiTrend}>
                            <MaterialIcons name="trending-up" size={14} color={theme.colors.primary} />
                            <Text style={styles.kpiTrendText}>+{analytics.resolvedChange}%</Text>
                            <Text style={styles.kpiTrendLabel}>vs last period</Text>
                        </View>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <MaterialIcons name="timer" size={20} color={theme.colors.textSecondary} />
                            <Text style={styles.kpiLabel}>AVG TIME</Text>
                        </View>
                        <Text style={styles.kpiValue}>{analytics.avgTime}</Text>
                        <View style={styles.kpiTrend}>
                            <MaterialIcons name="trending-down" size={14} color="#ef4444" />
                            <Text style={[styles.kpiTrendText, { color: '#ef4444' }]}>-{analytics.avgTimeChange}%</Text>
                            <Text style={styles.kpiTrendLabel}>slower</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Incident Trends</Text>
                            <Text style={styles.sectionSubtitle}>Volume over last {dateRange === '7d' ? '7 days' : dateRange}</Text>
                        </View>
                        <TouchableOpacity>
                            <MaterialIcons name="more-horiz" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <SplineTrendChart data={analytics.trendData} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Issue Types</Text>
                    {analytics.issueTypes.map((type, index) => (
                        <View key={index} style={styles.issueTypeItem}>
                            <View style={[styles.issueTypeIcon, { backgroundColor: type.color + '20' }]}>
                                <MaterialIcons name={type.icon} size={20} color={type.color} />
                            </View>
                            <View style={styles.issueTypeContent}>
                                <View style={styles.issueTypeHeader}>
                                    <Text style={styles.issueTypeName}>{type.name}</Text>
                                    <Text style={styles.issueTypePercent}>{type.percentage}%</Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${type.percentage}%`, backgroundColor: type.color }]} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Responder Efficiency</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {analytics.topResponders.map((responder, index) => (
                        <View key={index} style={styles.responderCard}>
                            <View style={styles.responderLeft}>
                                <Image source={{ uri: responder.avatar }} style={styles.responderAvatar} />
                                <View>
                                    <Text style={styles.responderName}>{responder.name}</Text>
                                    <Text style={styles.responderStats}>
                                        {responder.tickets} Tickets • {responder.efficiency}% Eff.
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.responderRight}>
                                <Text style={[styles.responderRating, { color: theme.colors.primary }]}>
                                    {responder.rating}
                                </Text>
                                <View style={styles.ratingBars}>
                                    {[...Array(4)].map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.ratingBar,
                                                { opacity: i < responder.ratingLevel ? 1 : 0.3 }
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.bottomNav}>
                <NavButton icon="dashboard" label="Dashboard" onPress={() => onNavPress('reviewer-dashboard')} />
                <NavButton icon="warning" label="Incidents" onPress={() => onNavPress('incoming-incidents')} />
                <NavButton icon="assignment" label="Assignments" onPress={() => onNavPress('assignments-list')} />
                <NavButton icon="analytics" label="Reports" active onPress={() => { }} />
            </View>
        </SafeAreaView>
    );
};

const NavButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navBtn} onPress={onPress}>
        {active && <View style={styles.activeIndicator} />}
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
        paddingTop: 48,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    filterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    contentPadding: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    dateBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    dateBtnActive: {
        backgroundColor: '#2C4A3A',
    },
    dateBtnText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },
    dateBtnTextActive: {
        color: theme.colors.primary,
    },
    kpiScroll: {
        marginBottom: 24,
        marginHorizontal: -theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
    },
    kpiCard: {
        width: 160,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    kpiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    kpiLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        letterSpacing: 1,
    },
    kpiValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    kpiTrend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    kpiTrendText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    kpiTrendLabel: {
        fontSize: 10,
        color: theme.colors.textMuted,
        marginLeft: 4,
    },
    section: {
        marginBottom: 24,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    chartContainer: {
        height: 200,
        marginTop: 10,
        paddingBottom: 10,
    },
    issueTypeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    issueTypeIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    issueTypeContent: {
        flex: 1,
    },
    issueTypeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    issueTypeName: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
    },
    issueTypePercent: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    responderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    responderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    responderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.textMuted,
    },
    responderName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    responderStats: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    responderRight: {
        alignItems: 'flex-end',
    },
    responderRating: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    ratingBars: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingBar: {
        width: 4,
        height: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
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
        position: 'relative',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    activeIndicator: {
        position: 'absolute',
        top: -8,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
});

export default ReportsScreen;

