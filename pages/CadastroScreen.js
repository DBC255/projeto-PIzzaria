import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const COLORS = {
  ink: '#2A211C',
  muted: '#85766C',
  red: '#C83B2B',
  cream: '#FFF9F1',
  paper: '#FFFFFF',
  line: '#F0E6DC',
};

export default function CadastroScreen({ initialProfile, onRegister, onBack }) {
  const [name, setName] = useState(initialProfile?.name ?? '');
  const [email, setEmail] = useState(initialProfile?.email ?? '');
  const [phone, setPhone] = useState(initialProfile?.phone ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !password || !confirmPassword) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos para continuar.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert('E-mail inválido', 'Digite um endereço de e-mail válido.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Senha muito curta', 'Sua senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'Confira se os dois campos de senha estão iguais.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Confirmação necessária', 'Aceite os termos para concluir o cadastro.');
      return;
    }

    // A senha é validada, mas não é salva no AsyncStorage.
    onRegister?.({ name: cleanName, email: cleanEmail, phone: cleanPhone });
  };

  return (
    <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹  Voltar</Text>
        </Pressable>

        <View style={styles.brandMark}>
          <Text style={styles.brandPi}>π</Text>
          <Text style={styles.brandDot}>.</Text>
        </View>

        <Text style={styles.eyebrow}>BEM-VINDO À πZZARIA</Text>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>
          Cadastre seus dados para facilitar seus próximos pedidos.
        </Text>

        <View style={styles.form}>
          <Field label="Nome completo" value={name} onChangeText={setName}
            placeholder="Como podemos te chamar?" autoCapitalize="words" />
          <Field label="E-mail" value={email} onChangeText={setEmail}
            placeholder="seuemail@exemplo.com" keyboardType="email-address"
            autoCapitalize="none" />
          <Field label="Telefone / WhatsApp" value={phone} onChangeText={setPhone}
            placeholder="(00) 00000-0000" keyboardType="phone-pad" />
          <Field label="Senha" value={password} onChangeText={setPassword}
            placeholder="Mínimo de 8 caracteres" secureTextEntry={!showPassword}
            autoCapitalize="none" rightAction={() => setShowPassword((v) => !v)}
            rightLabel={showPassword ? 'Ocultar' : 'Mostrar'} />
          <Field label="Confirme sua senha" value={confirmPassword}
            onChangeText={setConfirmPassword} placeholder="Digite a senha novamente"
            secureTextEntry={!showPassword} autoCapitalize="none" />

          <Pressable style={styles.termsRow}
            onPress={() => setAcceptedTerms((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}>
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>
              Li e aceito os termos de uso e a política de privacidade.
            </Text>
          </Pressable>

          <Pressable style={styles.submitButton} onPress={handleRegister}>
            <Text style={styles.submitText}>Criar minha conta  →</Text>
          </Pressable>

          <Text style={styles.footnote}>
            Cadastro demonstrativo: os dados pessoais são salvos localmente no aparelho.
            A senha não é armazenada e ainda não existe autenticação por servidor.
          </Text>
        </View>
        <Pressable style={styles.linkLogin} onPress={onBack}>
          <Text style={styles.textoLinkLogin}>
            Já tem conta? <Text style={styles.textoLinkLoginDestaque}>Entrar</Text>
          </Text>
        </Pressable>
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType,
  secureTextEntry, autoCapitalize, rightAction, rightLabel,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B1A49A"
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false}
          style={styles.input}
          selectionColor={COLORS.red}
        />
        {rightAction ? (
          <Pressable onPress={rightAction} hitSlop={10}>
            <Text style={styles.visibilityText}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 9, marginBottom: 16 },
  backText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  brandMark: {
    width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.red,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    marginBottom: 20,
  },
  brandPi: { color: COLORS.cream, fontSize: 34, fontWeight: '900', marginTop: -4 },
  brandDot: { color: '#F4BD6C', fontSize: 25, fontWeight: '900', marginLeft: -3, marginTop: 4 },
  eyebrow: { color: COLORS.red, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: COLORS.ink, fontSize: 29, fontWeight: '900', marginTop: 7 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 20 },
  form: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 19, padding: 15 },
  field: { marginBottom: 13 },
  label: { color: COLORS.ink, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  inputWrap: {
    minHeight: 47, borderRadius: 11, borderWidth: 1, borderColor: COLORS.line,
    backgroundColor: COLORS.cream, paddingHorizontal: 11,
    flexDirection: 'row', alignItems: 'center',
  },
  input: { flex: 1, color: COLORS.ink, fontSize: 12, paddingVertical: 10 },
  visibilityText: { color: COLORS.red, fontSize: 10, fontWeight: '900', marginLeft: 7 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 17 },
  checkbox: {
    width: 19, height: 19, borderRadius: 5, borderWidth: 1.5,
    borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  termsText: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 15 },
  submitButton: {
    minHeight: 49, borderRadius: 12, backgroundColor: COLORS.red,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
  },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  footnote: { color: COLORS.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 12 },
  linkLogin: { alignItems: 'center', paddingVertical: 12 },
textoLinkLogin: { color: COLORS.muted, fontSize: 12 },
textoLinkLoginDestaque: { color: COLORS.red, fontWeight: '900' },
});
