import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';

export default function Login({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const validarEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleLogin = async () => {
    setErroEmail('');
    setErroSenha('');
    let ok = true;

    if (!email.trim()) {
      setErroEmail('Informe o e-mail.');
      ok = false;
    } else if (!validarEmail(email.trim())) {
      setErroEmail('E-mail inválido.');
      ok = false;
    }

    if (!senha) {
      setErroSenha('Informe a senha.');
      ok = false;
    } else if (senha.length < 6) {
      setErroSenha('A senha deve ter pelo menos 6 caracteres.');
      ok = false;
    }

    if (!ok) return;

    try {
      setCarregando(true);
      // POST para API (substituir pela URL real):
      // const r = await fetch('https://api.pizzaria.com/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim(), senha }),
      // });
      // const dados = await r.json();

      await new Promise((r) => setTimeout(r, 800));
      onLoginSuccess?.({ email: email.trim() });
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.logo}>π</Text>
          <Text style={styles.titulo}>πzzaria</Text>
          <Text style={styles.subtitulo}>Acesse sua conta para pedir</Text>

          <View style={styles.campo}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, erroEmail ? styles.inputErro : null]}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErroEmail('');
              }}
            />
            {erroEmail ? <Text style={styles.erro}>{erroEmail}</Text> : null}
          </View>

          <View style={styles.campo}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={[styles.input, erroSenha ? styles.inputErro : null]}
              placeholder="Sua senha"
              placeholderTextColor="#999"
              secureTextEntry
              value={senha}
              onChangeText={(t) => {
                setSenha(t);
                setErroSenha('');
              }}
            />
            {erroSenha ? <Text style={styles.erro}>{erroSenha}</Text> : null}
          </View>

          <Pressable
            style={[styles.botao, carregando && styles.botaoDesativado]}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textoBotao}>Entrar</Text>
            )}
          </Pressable>

          <Pressable style={styles.linkCadastro} onPress={onGoToRegister}>
            <Text style={styles.textoLink}>
              Não tem conta?{' '}
              <Text style={styles.textoLinkDestaque}>Cadastre-se</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: { fontSize: 56, color: '#E67E22', textAlign: 'center', fontWeight: 'bold' },
  titulo: { fontSize: 28, fontWeight: '800', color: '#C0392B', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 28 },
  campo: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1E1E1E', marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E1E1E',
    backgroundColor: '#FAFAFA',
  },
  inputErro: { borderColor: '#E74C3C', backgroundColor: '#FDF0EF' },
  erro: { color: '#E74C3C', fontSize: 12, marginTop: 4 },
  botao: {
    backgroundColor: '#E67E22',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkCadastro: { marginTop: 20, alignItems: 'center' },
  textoLink: { color: '#666', fontSize: 14 },
  textoLinkDestaque: { color: '#C0392B', fontWeight: '700' },
});