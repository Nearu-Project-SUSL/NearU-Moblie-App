import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal as RNModal, 
  Pressable, 
  useColorScheme, 
  Dimensions,
  ViewStyle,
  Animated
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  height?: number;
  style?: ViewStyle;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  height = SCREEN_HEIGHT * 0.5,
  style,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap backdrop to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        {/* Modal content container acting as a Bottom Sheet */}
        <View 
          style={[
            styles.sheetContainer, 
            { 
              height, 
              backgroundColor: themeColors.surfaceCard, 
              borderColor: themeColors.border 
            },
            style
          ]}
        >
          {/* Header Drag Handle Indicator */}
          <View style={styles.dragHandleWrapper}>
            <View style={[styles.dragHandle, { backgroundColor: themeColors.border }]} />
          </View>

          {/* Header Title Block */}
          {title && (
            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={{ color: themeColors.textMuted, fontSize: 20, fontWeight: '300' }}>×</Text>
              </Pressable>
            </View>
          )}

          {/* Core Body Section */}
          <View style={styles.body}>
            {children}
          </View>

          {/* Optional Action Footer */}
          {footer ? (
            <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
              {footer}
            </View>
          ) : (
            title && (
              <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                <Button title="Dismiss" onPress={onClose} variant="secondary" style={{ width: '100%' }} />
              </View>
            )
          )}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Slate 900 with transparency
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    paddingBottom: 34, // Safe spacing for home indicator
  },
});
