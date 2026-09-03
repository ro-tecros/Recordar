import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { colors, radius, spacing } from '../theme';

interface InlineAddProps {
  placeholder: string;
  onAdd: (text: string) => void;
}

export function InlineAdd({ placeholder, onAdd }: InlineAddProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const canAdd = text.trim().length > 0;

  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    onAdd(clean);
    setText('');
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, focused && styles.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={submit}
        returnKeyType="done"
        blurOnSubmit={false}
      />
      <PressableScale
        onPress={submit}
        disabled={!canAdd}
        style={[styles.btn, !canAdd && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Agregar"
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.borderStrong,
  },
});
