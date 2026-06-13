import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
  FlatList,
  Dimensions,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getTestimonials, submitTestimonial, Testimonial } from '../services/testimonialsService';
import { Colors } from '../constants/Colors';

const C = Colors.light;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StarRating = ({
  rating,
  onRate,
  size = 24,
}: {
  rating: number;
  onRate?: (r: number) => void;
  size?: number;
}) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity
        key={star}
        onPress={() => onRate?.(star)}
        disabled={!onRate}
        activeOpacity={onRate ? 0.7 : 1}
      >
        <Text style={{ fontSize: size, color: star <= rating ? '#FBBF24' : '#D1D5DB' }}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function TestimonialsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const CARDS_PER_PAGE = 1;
  const totalPages = testimonials.length;

  const fetchTestimonials = useCallback(async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Auto rotate every 5 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;
    autoRotateRef.current = setInterval(() => {
      setCurrentPage(prev => {
        const next = (prev + 1) % totalPages;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [testimonials.length, totalPages]);

  const goToPage = (page: number) => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    setCurrentPage(page);
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
    autoRotateRef.current = setInterval(() => {
      setCurrentPage(prev => {
        const next = (prev + 1) % totalPages;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Validation', 'Please write a message.');
      return;
    }
    setSubmitting(true);
    try {
      await submitTestimonial({ message: message.trim(), rating });
      setModalVisible(false);
      setMessage('');
      setRating(5);
      Alert.alert('Thank you!', 'Your experience has been shared.');
      fetchTestimonials();
      setCurrentPage(0);
    } catch {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSharePress = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to share your experience.');
      return;
    }
    setModalVisible(true);
  };

  const renderTestimonial = ({ item }: { item: Testimonial }) => (
    <View style={[styles.testimonialCard, { width: SCREEN_WIDTH - 48 }]}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.userInitial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <StarRating rating={item.rating} size={18} />
      <Text style={styles.message}>"{item.message}"</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>💬</Text>
        <Text style={styles.headerTitle}>Student Experiences</Text>
        <Text style={styles.headerSub}>
          What the NearU community is saying
        </Text>
      </View>

      {/* Testimonials Carousel */}
      <View style={styles.carouselSection}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#E8572A" size="large" />
            <Text style={styles.loadingText}>Loading experiences...</Text>
          </View>
        ) : testimonials.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={styles.emptyText}>No testimonials yet</Text>
            <Text style={styles.emptySubText}>Be the first to share your experience!</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={testimonials}
              renderItem={renderTestimonial}
              keyExtractor={item => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH - 48}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 24 }}
              onMomentumScrollEnd={e => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48)
                );
                setCurrentPage(index);
              }}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH - 48,
                offset: (SCREEN_WIDTH - 48) * index,
                index,
              })}
            />

            {/* Dot indicators */}
            <View style={styles.dots}>
              {testimonials.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToPage(i)}>
                  <View
                    style={[
                      styles.dot,
                      i === currentPage && styles.dotActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Stats Row */}
      {testimonials.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{testimonials.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {(
                testimonials.reduce((sum, t) => sum + t.rating, 0) /
                testimonials.length
              ).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {testimonials.filter(t => t.rating === 5).length}
            </Text>
            <Text style={styles.statLabel}>5★ Reviews</Text>
          </View>
        </View>
      )}

      {/* Share Button */}
      <View style={styles.shareSection}>
        <Text style={styles.shareTitle}>Enjoyed using NearU?</Text>
        <Text style={styles.shareSubtitle}>
          Share your experience and help fellow students discover campus services.
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleSharePress}>
          <Text style={styles.shareBtnText}>⭐  Share Your Experience</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Experience</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalGreeting}>
              Hi {user?.firstName ?? 'Student'} 👋
            </Text>

            <Text style={styles.modalLabel}>Your Rating</Text>
            <StarRating rating={rating} onRate={setRating} size={32} />

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Your Message</Text>
            <TextInput
              style={styles.modalInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us about your experience with NearU..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{message.length}/500</Text>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    backgroundColor: '#2E9EBF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },

  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  carouselSection: {
    marginTop: 24,
    minHeight: 200,
  },

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
  },

  emptyCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },

  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },

  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2E9EBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  date: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  message: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginTop: 12,
    fontStyle: 'italic',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },

  dotActive: {
    backgroundColor: '#2E9EBF',
    width: 20,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E9EBF',
  },

  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },

  shareSection: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  shareTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },

  shareSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },

  shareBtn: {
    backgroundColor: '#2E9EBF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  modalClose: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },

  modalGreeting: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 20,
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },

  modalInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
    marginTop: 4,
  },

  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },

  submitBtn: {
    backgroundColor: '#2E9EBF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  submitBtnDisabled: {
    opacity: 0.6,
  },

  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});