import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAppData } from '../store/AppDataProvider';
import type { RootStackParamList } from '../navigation';
import { PressableScale } from '../components/PressableScale';
import { useConfirm } from '../components/ConfirmSheet';
import { colors, radius, spacing } from '../theme';
import { enterDown } from '../ui/motion';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ItemForm'>;
type Rt = RouteProp<RootStackParamList, 'ItemForm'>;

export function ItemFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const confirm = useConfirm();
  const { mode, id } = route.params;

  const {
    essentials,
    outings,
    editEssential,
    removeEssential,
    editOutingItem,
    removeOutingItem,
  } = useAppData();

  const existing = useMemo(() => {
    if (!id) return undefined;
    if (mode === 'essential') return essentials.find((e) => e.id === id);
    for (const o of outings) {
      const found = o.items.find((i) => i.id === id);
      if (found) return found;
    }
    return undefined;
  }, [id, mode, essentials, outings]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [enabled, setEnabled] = useState(
    existing && 'enabled' in existing ? existing.enabled : true
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'essential' ? 'Cosa de siempre' : 'Cosa de la salida',
    });
  }, [navigation, mode]);

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || !id) return;
    if (mode === 'essential') {
      await editEssential(id, { title, note, enabled });
    } else {
      await editOutingItem(id, { title, note });
    }
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (!id) return;
    const ok = await confirm({
      title: 'Eliminar',
      message: '¿Seguro que quieres eliminarlo?',
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    if (mode === 'essential') await removeEssential(id);
    else await removeOutingItem(id);
    navigation.goBack();
  };

  if (!existing) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Este elemento ya no existe.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enterDown(0, 240)}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            placeholder="Nombre"
            placeholderTextColor={colors.textMuted}
          />
        </Animated.View>

        <Animated.View entering={enterDown(1, 240)}>
          <Text style={styles.label}>Nota (opcional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="Detalles, cantidad, recordatorio…"
            placeholderTextColor={colors.textMuted}
          />
        </Animated.View>

        {mode === 'essential' ? (
          <Animated.View entering={enterDown(2, 240)} style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar al salir</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ true: colors.primary }}
            />
          </Animated.View>
        ) : null}

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <PressableScale
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveText}>Guardar</Text>
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  switchLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  deleteBtn: { marginTop: spacing.xl, padding: spacing.md, alignItems: 'center' },
  deleteText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.borderStrong },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  missingText: { color: colors.textMuted, fontSize: 15 },
});
