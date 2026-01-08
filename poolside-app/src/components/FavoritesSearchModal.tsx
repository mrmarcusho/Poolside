import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Interest } from './InterestsGallery';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

// Search result types
interface MovieResult {
  id: string;
  title: string;
  year: string;
  poster: string;
}

interface ArtistResult {
  id: string;
  name: string;
  image: string;
}

interface SongResult {
  id: string;
  title: string;
  artist: string;
  artwork: string;
}

interface FoodResult {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  image: string;
}

interface SportResult {
  id: string;
  name: string;
  emoji: string;
}

type SearchResult = MovieResult | ArtistResult | SongResult | FoodResult | SportResult;

interface FavoritesSearchModalProps {
  visible: boolean;
  type: Interest['type'];
  onClose: () => void;
  onSelect: (interest: Interest) => void;
}

// Predefined foods list
const FOODS_LIST: FoodResult[] = [
  { id: '1', name: 'Omakase Sushi', cuisine: 'Japanese', emoji: '🍣', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80' },
  { id: '2', name: 'Neapolitan Pizza', cuisine: 'Italian', emoji: '🍕', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
  { id: '3', name: 'Wagyu Steak', cuisine: 'Japanese', emoji: '🥩', image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&q=80' },
  { id: '4', name: 'Pad Thai', cuisine: 'Thai', emoji: '🍜', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80' },
  { id: '5', name: 'Tacos al Pastor', cuisine: 'Mexican', emoji: '🌮', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80' },
  { id: '6', name: 'Pho', cuisine: 'Vietnamese', emoji: '🍲', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&q=80' },
  { id: '7', name: 'Croissant', cuisine: 'French', emoji: '🥐', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80' },
  { id: '8', name: 'Dim Sum', cuisine: 'Chinese', emoji: '🥟', image: 'https://images.unsplash.com/photo-1576097449798-7c7f90e1248a?w=400&q=80' },
  { id: '9', name: 'Bibimbap', cuisine: 'Korean', emoji: '🍚', image: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&q=80' },
  { id: '10', name: 'Butter Chicken', cuisine: 'Indian', emoji: '🍛', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
  { id: '11', name: 'Lobster Roll', cuisine: 'American', emoji: '🦞', image: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=400&q=80' },
  { id: '12', name: 'Gelato', cuisine: 'Italian', emoji: '🍨', image: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&q=80' },
];

// Predefined sports list
const SPORTS_LIST: SportResult[] = [
  { id: '1', name: 'Tennis', emoji: '🎾' },
  { id: '2', name: 'Basketball', emoji: '🏀' },
  { id: '3', name: 'Soccer', emoji: '⚽' },
  { id: '4', name: 'Golf', emoji: '⛳' },
  { id: '5', name: 'Swimming', emoji: '🏊' },
  { id: '6', name: 'Running', emoji: '🏃' },
  { id: '7', name: 'Cycling', emoji: '🚴' },
  { id: '8', name: 'Yoga', emoji: '🧘' },
  { id: '9', name: 'Surfing', emoji: '🏄' },
  { id: '10', name: 'Skiing', emoji: '⛷️' },
  { id: '11', name: 'Volleyball', emoji: '🏐' },
  { id: '12', name: 'Boxing', emoji: '🥊' },
  { id: '13', name: 'Hiking', emoji: '🥾' },
  { id: '14', name: 'Rock Climbing', emoji: '🧗' },
  { id: '15', name: 'Martial Arts', emoji: '🥋' },
];

// OMDb API for movies
const searchMovies = async (query: string): Promise<MovieResult[]> => {
  if (!query.trim()) return [];
  try {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=trilogy`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.Response === 'False') return [];
    return (data.Search || []).slice(0, 10).map((movie: any) => ({
      id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster !== 'N/A' ? movie.Poster : '',
    }));
  } catch (error) {
    console.error('Movie search error:', error);
    return [];
  }
};

// iTunes API for artists (uses album artwork as artist image)
const searchArtists = async (query: string): Promise<ArtistResult[]> => {
  if (!query.trim()) return [];
  try {
    // Search albums to get artist images (artists don't have images in iTunes API)
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=30`
    );
    const data = await response.json();

    // Dedupe by artistId and use album artwork as artist image
    const artistMap = new Map<string, ArtistResult>();
    for (const item of data.results || []) {
      const artistId = item.artistId?.toString();
      if (artistId && !artistMap.has(artistId)) {
        artistMap.set(artistId, {
          id: artistId,
          name: item.artistName,
          image: item.artworkUrl100?.replace('100x100', '500x500') || '',
        });
      }
    }
    return Array.from(artistMap.values()).slice(0, 15);
  } catch (error) {
    console.error('Artist search error:', error);
    return [];
  }
};

// iTunes API for songs
const searchSongs = async (query: string): Promise<SongResult[]> => {
  if (!query.trim()) return [];
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`
    );
    const data = await response.json();
    return (data.results || []).map((item: any) => ({
      id: item.trackId?.toString(),
      title: item.trackName,
      artist: item.artistName,
      artwork: item.artworkUrl100?.replace('100x100', '500x500') || '',
    }));
  } catch (error) {
    console.error('Song search error:', error);
    return [];
  }
};

// Search foods
const searchFoods = (query: string): FoodResult[] => {
  if (!query.trim()) return FOODS_LIST;
  const lowerQuery = query.toLowerCase();
  return FOODS_LIST.filter(
    food =>
      food.name.toLowerCase().includes(lowerQuery) ||
      food.cuisine.toLowerCase().includes(lowerQuery)
  );
};

// Search sports
const searchSports = (query: string): SportResult[] => {
  if (!query.trim()) return SPORTS_LIST;
  const lowerQuery = query.toLowerCase();
  return SPORTS_LIST.filter(sport => sport.name.toLowerCase().includes(lowerQuery));
};

const getPlaceholder = (type: Interest['type']): string => {
  switch (type) {
    case 'movie': return 'Search for a movie...';
    case 'artist': return 'Search for an artist...';
    case 'song': return 'Search for a song...';
    case 'food': return 'Search for a food...';
    case 'sport': return 'Search for a sport...';
    default: return 'Search...';
  }
};

const getTitle = (type: Interest['type']): string => {
  switch (type) {
    case 'movie': return 'Favorite Movie';
    case 'artist': return 'Favorite Artist';
    case 'song': return 'Favorite Song';
    case 'food': return 'Favorite Food';
    case 'sport': return 'Favorite Sport';
    default: return 'Favorite';
  }
};

export const FavoritesSearchModal: React.FC<FavoritesSearchModalProps> = ({
  visible,
  type,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const translateY = useSharedValue(MODAL_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 300);
      // Load initial results for food and sports
      if (type === 'food') setResults(FOODS_LIST);
      if (type === 'sport') setResults(SPORTS_LIST);
    } else {
      translateY.value = withTiming(MODAL_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
      setSearchQuery('');
      setResults([]);
    }
  }, [visible]);

  // Search effect
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (!visible) return;

      setIsLoading(true);
      try {
        switch (type) {
          case 'movie':
            setResults(await searchMovies(searchQuery));
            break;
          case 'artist':
            setResults(await searchArtists(searchQuery));
            break;
          case 'song':
            setResults(await searchSongs(searchQuery));
            break;
          case 'food':
            setResults(searchFoods(searchQuery));
            break;
          case 'sport':
            setResults(searchSports(searchQuery));
            break;
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, type, visible]);

  const handleSelect = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let interest: Interest;
    switch (type) {
      case 'movie':
        const movieResult = result as MovieResult;
        interest = {
          type: 'movie',
          title: movieResult.title,
          year: movieResult.year,
          image: movieResult.poster,
        };
        break;
      case 'artist':
        const artistResult = result as ArtistResult;
        interest = {
          type: 'artist',
          name: artistResult.name,
          image: artistResult.image,
        };
        break;
      case 'song':
        const songResult = result as SongResult;
        interest = {
          type: 'song',
          title: songResult.title,
          artist: songResult.artist,
          image: songResult.artwork,
        };
        break;
      case 'food':
        const foodResult = result as FoodResult;
        interest = {
          type: 'food',
          name: foodResult.name,
          cuisine: foodResult.cuisine,
          emoji: foodResult.emoji,
          image: foodResult.image,
        };
        break;
      case 'sport':
        const sportResult = result as SportResult;
        interest = {
          type: 'sport',
          name: sportResult.name,
          level: 'casual',
          emoji: sportResult.emoji,
        };
        break;
      default:
        return;
    }

    onSelect(interest);
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Drag gesture for dismiss
  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        translateY.value = withTiming(MODAL_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
        });
      }
    });

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const renderResultItem = ({ item, index }: { item: SearchResult; index: number }) => {
    const isMovie = type === 'movie';
    const isArtist = type === 'artist';
    const isSong = type === 'song';
    const isFood = type === 'food';
    const isSport = type === 'sport';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        {(isMovie || isArtist || isSong || isFood) && (
          <Image
            source={{ uri: (item as any).poster || (item as any).artwork || (item as any).image }}
            style={[
              styles.resultImage,
              isMovie && styles.resultImageMovie,
              (isArtist || isSong) && styles.resultImageAlbum,
              isFood && styles.resultImageFood,
            ]}
          />
        )}
        {isSport && (
          <View style={styles.sportEmojiContainer}>
            <Text style={styles.sportEmoji}>{(item as SportResult).emoji}</Text>
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {(item as any).title || (item as any).name}
          </Text>
          {(isMovie) && (
            <Text style={styles.resultSubtitle}>{(item as MovieResult).year}</Text>
          )}
          {(isSong) && (
            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {(item as SongResult).artist}
            </Text>
          )}
          {isFood && (
            <Text style={styles.resultSubtitle}>
              {(item as FoodResult).emoji} {(item as FoodResult).cuisine}
            </Text>
          )}
        </View>
        <View style={styles.selectIndicator}>
          <Text style={styles.selectText}>+</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <GestureDetector gesture={dragGesture}>
          <Animated.View style={[styles.modal, modalStyle]}>
            <BlurView intensity={80} tint="dark" style={styles.blurView}>
              {/* Drag Handle */}
              <View style={styles.dragHandle}>
                <View style={styles.dragBar} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{getTitle(type)}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder={getPlaceholder(type)}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={styles.clearButton}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Results */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.resultsContainer}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                  </View>
                ) : results.length === 0 && searchQuery.length > 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={(item, index) => `${(item as any).id}-${index}`}
                    renderItem={renderResultItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.resultsList}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </KeyboardAvoidingView>
            </BlurView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.85)',
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  clearButton: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultImage: {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultImageMovie: {
    width: 50,
    height: 75,
  },
  resultImageAlbum: {
    width: 56,
    height: 56,
  },
  resultImageFood: {
    width: 56,
    height: 56,
  },
  sportEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportEmoji: {
    fontSize: 28,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 14,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  selectIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 20,
    color: '#a78bfa',
    fontWeight: '300',
  },
});
