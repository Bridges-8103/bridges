import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/services/profile/keys';
import { useCreateProfileMutation, useUpdateProfileMutation } from '@/services/profile/mutations';
import { useProfileQuery } from '@/services/profile/queries';
import type { UserProfile } from '@/services/profile/types';
import { useTaxonomyQuery } from '@/services/taxonomy/queries';
import type { TagType, TaxonomyTag } from '@/services/taxonomy/types';

type TagField = 'skills' | 'interests' | 'expertise';

const FIELD_CONFIG: Record<
  TagField,
  {
    title: string;
    subtitle: string;
    tagType: TagType;
    colorKey: 'primary' | 'accentPurple';
    placeholder: string;
  }
> = {
  skills: {
    title: 'Select Skills',
    subtitle: 'Tools, languages & capabilities you want to develop',
    tagType: 'SKILL',
    colorKey: 'primary',
    placeholder: 'Search skills (e.g. Python, SQL, Lab)...',
  },
  interests: {
    title: 'Select Interests',
    subtitle: 'Fields and research topics you want to explore',
    tagType: 'INTEREST',
    colorKey: 'accentPurple',
    placeholder: 'Search interests (e.g. AI, Cancer, Finance)...',
  },
  expertise: {
    title: 'Select Mentorship Expertise',
    subtitle: 'Topics you can guide students on',
    tagType: 'BOTH',
    colorKey: 'accentPurple',
    placeholder: 'Search topics (e.g. Machine Learning, Neuroscience)...',
  },
};

export default function SelectTagsScreen() {
  const params = useLocalSearchParams<{ field?: TagField }>();
  const fieldKey: TagField =
    params.field === 'interests' || params.field === 'expertise'
      ? params.field
      : 'skills';

  const { data: profile, isLoading } = useProfileQuery();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SelectTagsContent
      key={`${profile?.id ?? 'new'}-${fieldKey}`}
      profile={profile}
      fieldKey={fieldKey}
    />
  );
}

function SelectTagsContent({
  profile,
  fieldKey,
}: {
  profile: UserProfile | null | undefined;
  fieldKey: TagField;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const config = FIELD_CONFIG[fieldKey];
  const accent = theme[config.colorKey];

  // Direct mutations to update database and invalidate TanStack cache
  const updateProfileMutation = useUpdateProfileMutation();
  const createProfileMutation = useCreateProfileMutation();

  // Fetch mentor-backed taxonomy from backend
  const {
    data: categories = [],
    isLoading: isTaxonomyLoading,
    isError,
    refetch,
  } = useTaxonomyQuery(config.tagType);

  const initialTags = useMemo(() => {
    if (fieldKey === 'skills') return profile?.studentDetail?.skills || [];
    if (fieldKey === 'interests') return profile?.studentDetail?.interests || [];
    return profile?.mentorDetail?.expertise || [];
  }, [profile, fieldKey]);

  const [draftTags, setDraftTags] = useState<string[]>(initialTags);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllInCategory, setShowAllInCategory] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const toggleDraftTag = (tag: string) => {
    setDraftTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  // Directly update profile in database and refresh cache
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      let savedProfile: UserProfile | null = null;
      if (profile?.id) {
        savedProfile = await updateProfileMutation.mutateAsync({
          id: profile.id,
          input: {
            [fieldKey]: draftTags,
          },
        });
      } else {
        savedProfile = await createProfileMutation.mutateAsync({
          userId: user?.id || 'usr_current',
          email: user?.email,
          displayName: user?.name || 'User',
          role: fieldKey === 'expertise' ? 'MENTOR' : 'STUDENT',
          [fieldKey]: draftTags,
        });
      }

      if (savedProfile) {
        queryClient.setQueryData(profileKeys.current(), savedProfile);
      }
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
        refetchType: 'all',
      });

      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile tags.';
      Alert.alert('Save Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Build lookup map of all tags
  const allTagsMap = useMemo(() => {
    const map = new Map<string, TaxonomyTag>();
    for (const cat of categories) {
      for (const tag of cat.tags) {
        if (!map.has(tag.name.toLowerCase())) {
          map.set(tag.name.toLowerCase(), tag);
        }
      }
    }
    return map;
  }, [categories]);

  // Search results across categories & aliases
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: TaxonomyTag[] = [];
    for (const cat of categories) {
      for (const tag of cat.tags) {
        const matchesName = tag.name.toLowerCase().includes(q);
        const matchesAlias = tag.aliases.some((alias) => alias.toLowerCase().includes(q));
        if (matchesName || matchesAlias) {
          results.push(tag);
        }
      }
    }

    const unique = Array.from(new Map(results.map((t) => [t.name, t])).values());
    return unique.sort((a, b) => b.mentorCount - a.mentorCount).slice(0, 60);
  }, [categories, searchQuery]);

  // Current category display tags
  const currentCategoryTags = useMemo(() => {
    if (activeCategorySlug === 'all') {
      const curated: TaxonomyTag[] = [];
      for (const cat of categories) {
        curated.push(...cat.tags.filter((t) => t.isCurated).slice(0, 10));
      }
      return curated.sort((a, b) => b.mentorCount - a.mentorCount);
    }

    const cat = categories.find((c) => c.slug === activeCategorySlug);
    if (!cat) return [];

    if (showAllInCategory) {
      return cat.tags;
    }
    return cat.tags.filter((t) => t.isCurated).slice(0, 25);
  }, [activeCategorySlug, categories, showAllInCategory]);

  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);
  const totalCountInActiveCategory = activeCategory?.tags.length || 0;

  const isSearching = searchQuery.trim().length > 0;
  const isExactSearchMatch =
    isSearching &&
    (allTagsMap.has(searchQuery.trim().toLowerCase()) ||
      draftTags.some((t) => t.toLowerCase() === searchQuery.trim().toLowerCase()));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Header with Cancel, Title, and Save */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleCancel} hitSlop={12} style={styles.headerButton}>
          <ThemedText style={{ color: theme.mutedText, fontSize: 16 }}>Cancel</ThemedText>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <ThemedText style={styles.headerTitle}>{config.title}</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.mutedText }]}>
            {config.subtitle}
          </ThemedText>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={12}
          style={styles.headerButton}>
          {isSaving ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <Text style={[styles.saveBtnText, { color: accent }]}>
              Done{draftTags.length > 0 ? ` (${draftTags.length})` : ''}
            </Text>
          )}
        </Pressable>
      </View>

      {/* 2. Native Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.inputBackground, borderColor: theme.border },
          ]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor={theme.mutedText}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={config.placeholder}
            placeholderTextColor={theme.mutedText}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                size={16}
                tintColor={theme.mutedText}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* 3. Selected Tags Row (Live Count & Chips) */}
      {draftTags.length > 0 && (
        <View style={[styles.selectedBar, { borderBottomColor: theme.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedScrollContent}>
            <ThemedText style={[styles.selectedLabel, { color: theme.labelText }]}>
              Selected ({draftTags.length}):
            </ThemedText>
            {draftTags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleDraftTag(tag)}
                style={[
                  styles.selectedChip,
                  { backgroundColor: `${accent}15`, borderColor: accent },
                ]}>
                <ThemedText style={[styles.chipText, { color: accent, fontWeight: '600' }]}>
                  {tag}
                </ThemedText>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={11}
                  tintColor={accent}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 4. Main Body */}
      {isTaxonomyLoading && categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={accent} />
          <ThemedText style={{ color: theme.mutedText, marginTop: 12 }}>
            Loading mentor-backed topics...
          </ThemedText>
        </View>
      ) : isError && categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText style={{ color: theme.mutedText }}>Could not load topics.</ThemedText>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: accent }]}>
            <ThemedText style={{ color: accent, fontWeight: '600' }}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {isSearching ? (
            // Search Results
            <View style={styles.sectionWrap}>
              <ThemedText style={[styles.sectionHeading, { color: theme.labelText }]}>
                Search Results ({searchResults.length})
              </ThemedText>

              {searchResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={{ color: theme.mutedText, fontSize: 14 }}>
                    No matching topics found for &quot;{searchQuery}&quot;.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.chipsWrap}>
                  {searchResults.map((tag) => {
                    const isSelected = draftTags.includes(tag.name);
                    return (
                      <Pressable
                        key={tag.slug}
                        onPress={() => toggleDraftTag(tag.name)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? `${accent}1A` : theme.inputBackground,
                            borderColor: isSelected ? accent : theme.border,
                          },
                        ]}>
                        {isSelected && (
                          <SymbolView
                            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                            size={13}
                            tintColor={accent}
                          />
                        )}
                        <ThemedText
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? accent : theme.text,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}>
                          {tag.name}
                        </ThemedText>
                        {tag.mentorCount > 0 && (
                          <View
                            style={[styles.mentorBadge, { backgroundColor: `${accent}12` }]}>
                            <Text style={[styles.mentorBadgeText, { color: accent }]}>
                              {tag.mentorCount}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Add Custom Tag Button */}
              {!isExactSearchMatch && searchQuery.trim().length >= 2 && (
                <Pressable
                  onPress={() => {
                    toggleDraftTag(searchQuery.trim());
                    setSearchQuery('');
                  }}
                  style={[styles.addCustomBtn, { borderColor: accent }]}>
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={15}
                    tintColor={accent}
                  />
                  <ThemedText style={{ color: accent, fontSize: 14, fontWeight: '600' }}>
                    Add custom &quot;{searchQuery.trim()}&quot;
                  </ThemedText>
                </Pressable>
              )}
            </View>
          ) : (
            // Category Browsing View
            <View style={styles.sectionWrap}>
              {/* Category Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabsScroll}>
                <Pressable
                  onPress={() => {
                    setActiveCategorySlug('all');
                    setShowAllInCategory(false);
                  }}
                  style={[
                    styles.categoryTab,
                    {
                      backgroundColor:
                        activeCategorySlug === 'all' ? accent : theme.inputBackground,
                      borderColor: activeCategorySlug === 'all' ? accent : theme.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.categoryTabText,
                      { color: activeCategorySlug === 'all' ? '#FFFFFF' : theme.text },
                    ]}>
                    Top Curated
                  </Text>
                </Pressable>

                {categories.map((cat) => {
                  const isActive = activeCategorySlug === cat.slug;
                  const formatCount =
                    cat.mentorCount >= 1000
                      ? `${(cat.mentorCount / 1000).toFixed(1)}k`
                      : String(cat.mentorCount);

                  return (
                    <Pressable
                      key={cat.slug}
                      onPress={() => {
                        setActiveCategorySlug(cat.slug);
                        setShowAllInCategory(false);
                      }}
                      style={[
                        styles.categoryTab,
                        {
                          backgroundColor: isActive ? accent : theme.inputBackground,
                          borderColor: isActive ? accent : theme.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.categoryTabText,
                          { color: isActive ? '#FFFFFF' : theme.text },
                        ]}>
                        {cat.name}
                      </Text>
                      {cat.mentorCount > 0 && (
                        <View
                          style={[
                            styles.tabCountBadge,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255,255,255,0.25)'
                                : theme.border,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.tabCountText,
                              { color: isActive ? '#FFFFFF' : theme.mutedText },
                            ]}>
                            {formatCount}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Chips Grid */}
              <View style={styles.chipsWrap}>
                {currentCategoryTags.map((tag) => {
                  const isSelected = draftTags.includes(tag.name);
                  return (
                    <Pressable
                      key={tag.slug}
                      onPress={() => toggleDraftTag(tag.name)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? `${accent}1A` : theme.inputBackground,
                          borderColor: isSelected ? accent : theme.border,
                        },
                      ]}>
                      {isSelected && (
                        <SymbolView
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          size={13}
                          tintColor={accent}
                        />
                      )}
                      <ThemedText
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? accent : theme.text,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}>
                        {tag.name}
                      </ThemedText>
                      {tag.mentorCount > 0 && (
                        <View
                          style={[styles.mentorBadge, { backgroundColor: `${accent}12` }]}>
                          <Text style={[styles.mentorBadgeText, { color: accent }]}>
                            {tag.mentorCount}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Show All Toggle if > 25 tags */}
              {activeCategorySlug !== 'all' && totalCountInActiveCategory > 25 && (
                <Pressable
                  onPress={() => setShowAllInCategory(!showAllInCategory)}
                  style={styles.showMoreBtn}>
                  <ThemedText style={{ color: accent, fontSize: 13, fontWeight: '600' }}>
                    {showAllInCategory
                      ? 'Show curated top 25'
                      : `Show all ${totalCountInActiveCategory} topics in this category`}
                  </ThemedText>
                  <SymbolView
                    name={{
                      ios: showAllInCategory ? 'chevron.up' : 'chevron.down',
                      android: showAllInCategory ? 'expand_less' : 'expand_more',
                      web: showAllInCategory ? 'expand_less' : 'expand_more',
                    }}
                    size={14}
                    tintColor={accent}
                  />
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* 5. Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.bottomSaveButton, { backgroundColor: accent }]}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bottomSaveButtonText}>
              Save Selection ({draftTags.length})
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    minWidth: 64,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  selectedBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  selectedScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  categoryTabsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
  },
  mentorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  mentorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#F8F9FE',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomSaveButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
});
