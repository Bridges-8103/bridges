import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import {
  useAcceptConnectionMutation,
  useConnectionStatusQuery,
  useConnectMutation,
  useDeclineConnectionMutation,
  useRemoveConnectionMutation,
} from '@/services/connections';

export type ConnectionButtonVariant = 'primary' | 'secondary' | 'compact' | 'bottom-bar';

interface ConnectionButtonProps {
  targetUserId: string | number;
  targetUserName?: string;
  variant?: ConnectionButtonVariant;
  style?: object;
}

export function ConnectionButton({
  targetUserId,
  targetUserName = 'User',
  variant = 'primary',
  style,
}: ConnectionButtonProps) {
  const numTargetId = Number(targetUserId);

  const { data, isLoading } = useConnectionStatusQuery(targetUserId);
  const status = data?.status ?? 'NONE';
  const connectionId = data?.connectionId;

  const connectMutation = useConnectMutation();
  const acceptMutation = useAcceptConnectionMutation();
  const declineMutation = useDeclineConnectionMutation();
  const removeMutation = useRemoveConnectionMutation();

  const isMutating =
    connectMutation.isPending ||
    acceptMutation.isPending ||
    declineMutation.isPending ||
    removeMutation.isPending;

  // Modal state for optional introductory note
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  if (status === 'SELF') {
    return null;
  }

  const handleConnectPress = () => {
    // Show prompt to either send directly or add an intro note
    Alert.alert(
      `Connect with ${targetUserName}`,
      'Would you like to include an introductory note with your invitation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add Note',
          onPress: () => {
            setNoteText('');
            setIsNoteModalVisible(true);
          },
        },
        {
          text: 'Send Now',
          style: 'default',
          onPress: () => {
            connectMutation.mutate({
              receiverId: numTargetId,
            });
          },
        },
      ]
    );
  };

  const handleSendNote = () => {
    setIsNoteModalVisible(false);
    connectMutation.mutate({
      receiverId: numTargetId,
      note: noteText.trim() || undefined,
    });
  };

  const handlePendingPress = () => {
    if (!connectionId) return;
    Alert.alert(
      'Pending Invitation',
      `You sent a connection request to ${targetUserName}. Would you like to withdraw this invitation?`,
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Withdraw Request',
          style: 'destructive',
          onPress: () => removeMutation.mutate({ connectionId, targetUserId }),
        },
      ]
    );
  };

  const handleConnectedPress = () => {
    if (!connectionId) return;
    Alert.alert(
      `Remove Connection`,
      `Are you sure you want to remove your connection with ${targetUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Connection',
          style: 'destructive',
          onPress: () => removeMutation.mutate({ connectionId, targetUserId }),
        },
      ]
    );
  };

  const handleAccept = () => {
    if (!connectionId) return;
    acceptMutation.mutate({ connectionId, targetUserId });
  };

  const handleDecline = () => {
    if (!connectionId) return;
    declineMutation.mutate({ connectionId, targetUserId });
  };

  // State: Loading
  if (isLoading) {
    return (
      <View style={[styles.base, getVariantStyle(variant), styles.loadingState, style]}>
        <ActivityIndicator size="small" color="#3B5DF6" />
      </View>
    );
  }

  // State: PENDING_RECEIVED (Two buttons: Accept / Decline)
  if (status === 'PENDING_RECEIVED') {
    return (
      <View style={[styles.receivedRow, style]}>
        <Pressable
          accessibilityRole="button"
          disabled={isMutating}
          onPress={handleAccept}
          style={({ pressed }) => [
            styles.acceptBtn,
            variant === 'compact' && styles.compactBtn,
            pressed && styles.pressed,
          ]}>
          {acceptMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={14}
                tintColor="#FFFFFF"
              />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isMutating}
          onPress={handleDecline}
          style={({ pressed }) => [
            styles.declineBtn,
            variant === 'compact' && styles.compactBtn,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </Pressable>
      </View>
    );
  }

  // State: CONNECTED
  if (status === 'CONNECTED') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isMutating}
        onPress={handleConnectedPress}
        style={({ pressed }) => [
          styles.base,
          getVariantStyle(variant),
          styles.connectedBtn,
          pressed && styles.pressed,
          style,
        ]}>
        {removeMutation.isPending ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : (
          <>
            <SymbolView
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
              size={15}
              tintColor="#10B981"
            />
            <Text style={styles.connectedBtnText}>Connected</Text>
          </>
        )}
      </Pressable>
    );
  }

  // State: PENDING_SENT
  if (status === 'PENDING_SENT') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isMutating}
        onPress={handlePendingPress}
        style={({ pressed }) => [
          styles.base,
          getVariantStyle(variant),
          styles.pendingBtn,
          pressed && styles.pressed,
          style,
        ]}>
        {removeMutation.isPending ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : (
          <>
            <SymbolView
              name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
              size={14}
              tintColor="#6B7280"
            />
            <Text style={styles.pendingBtnText}>Pending</Text>
          </>
        )}
      </Pressable>
    );
  }

  // State: NONE or DECLINED (Show Connect button)
  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={isMutating}
        onPress={handleConnectPress}
        style={({ pressed }) => [
          styles.base,
          getVariantStyle(variant),
          variant === 'bottom-bar'
            ? styles.bottomBarConnectBtn
            : variant === 'secondary'
            ? styles.secondaryConnectBtn
            : styles.primaryConnectBtn,
          pressed && styles.pressed,
          style,
        ]}>
        {connectMutation.isPending ? (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' || variant === 'bottom-bar' ? '#3B5DF6' : '#FFFFFF'}
          />
        ) : (
          <>
            <SymbolView
              name={{
                ios: 'person.badge.plus',
                android: 'person_add',
                web: 'person_add',
              }}
              size={variant === 'compact' ? 14 : 16}
              tintColor={
                variant === 'secondary' || variant === 'bottom-bar' ? '#3B5DF6' : '#FFFFFF'
              }
            />
            <Text
              style={[
                styles.connectBtnText,
                (variant === 'secondary' || variant === 'bottom-bar') &&
                  styles.connectBtnTextSecondary,
                variant === 'compact' && styles.compactBtnText,
              ]}>
              Connect
            </Text>
          </>
        )}
      </Pressable>

      {/* Optional Note Modal */}
      <Modal
        visible={isNoteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNoteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Connect with {targetUserName}</Text>
            <Text style={styles.modalSubtitle}>
              {`Include an optional note to introduce yourself and share why you'd like to connect.`}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Hi, I'd like to connect with you on Bridges..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              maxLength={300}
              value={noteText}
              onChangeText={setNoteText}
            />

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsNoteModalVisible(false)}
                style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleSendNote}
                style={styles.modalSendBtn}>
                <Text style={styles.modalSendBtnText}>Send Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function getVariantStyle(variant: ConnectionButtonVariant) {
  switch (variant) {
    case 'bottom-bar':
      return styles.variantBottomBar;
    case 'compact':
      return styles.variantCompact;
    case 'secondary':
      return styles.variantSecondary;
    case 'primary':
    default:
      return styles.variantPrimary;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  loadingState: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F8',
  },
  variantPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 42,
  },
  variantSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#3B5DF6',
    backgroundColor: '#EEF2FF',
  },
  variantBottomBar: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3B5DF6',
    backgroundColor: '#EEF2FF',
    minHeight: 48,
  },
  variantCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 32,
  },
  primaryConnectBtn: {
    backgroundColor: '#3B5DF6',
  },
  secondaryConnectBtn: {
    backgroundColor: '#EEF2FF',
  },
  bottomBarConnectBtn: {
    backgroundColor: '#EEF2FF',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  connectBtnTextSecondary: {
    color: '#3B5DF6',
  },
  compactBtnText: {
    fontSize: 12,
  },
  pendingBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  connectedBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  connectedBtnText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  receivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declineBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  compactBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  // Note Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  modalCancelBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#3B5DF6',
  },
  modalSendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
