# Guia de Integração RotaFinal SDK

## 🚀 Deploy Concluído

✅ **Edge Functions deployadas com sucesso:**
- `assign-variant` - Atribui variantes de experimentos
- `track-event` - Rastreia eventos de conversão  
- `get-metrics` - Obtém métricas de experimentos

✅ **Variáveis de ambiente configuradas:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

✅ **Servidor de desenvolvimento rodando em:** http://localhost:3000

## 📦 SDK de Integração

### 1. Script Anti-Flicker (Obrigatório)

Adicione este script no `<head>` da sua página **ANTES** de qualquer conteúdo que será testado:

```html
<script>
(function() {
  // Anti-flicker script inline
  var s = document.createElement('style');
  s.innerHTML = '.rf-hide{opacity:0 !important;visibility:hidden !important;}body.rf-ready .rf-hide{opacity:1 !important;visibility:visible !important;transition:opacity 200ms,visibility 200ms;}';
  document.head.appendChild(s);
  
  window.rfAntiFlicker = {
    hide: function(sel) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        els[i].classList.add('rf-hide');
      }
    },
    ready: function() {
      document.body.classList.add('rf-ready');
      var els = document.querySelectorAll('.rf-hide');
      for (var i = 0; i < els.length; i++) {
        els[i].classList.remove('rf-hide');
      }
    }
  };
})();
</script>
```

### 2. Carregar SDK

```html
<script src="https://rotafinal.com.br/rotafinal-sdk.js"></script>
```

### 3. Usar o SDK

```javascript
// Inicializar SDK
const rf = new RotaFinal({
  apiKey: 'pk_live_sua_chave_aqui',
  debug: true // Ativar logs de debug
});

// Executar experimento
async function runExperiment() {
  // Esconder elementos até carregar variante
  rfAntiFlicker.hide('[data-variant]');
  
  // Obter variante
  const variant = await rf.getVariant('meu_experimento', {
    userAttributes: {
      source: 'homepage',
      device: 'mobile'
    }
  });
  
  // Aplicar variante
  const variantElement = document.querySelector(`[data-variant="${variant}"]`);
  if (variantElement) {
    variantElement.style.display = 'block';
  }
  
  // Marcar como pronto
  rfAntiFlicker.ready();
}

// Rastrear conversão
function trackConversion() {
  rf.conversion('compra_realizada', 99.90, {
    experiment: 'meu_experimento',
    page: 'checkout'
  });
}

// Executar quando página carregar
document.addEventListener('DOMContentLoaded', runExperiment);
```

## 🧪 Exemplo Completo

Veja o arquivo `public/rotafinal-example.html` para um exemplo completo de integração.

## 📊 Métodos Disponíveis

### `getVariant(experimentKey, options)`
Obtém a variante atribuída para um experimento.

**Parâmetros:**
- `experimentKey` (string): Chave do experimento
- `options` (object): Opções adicionais
  - `userAttributes`: Atributos do usuário
  - `context`: Contexto adicional
  - `defaultVariant`: Variante padrão em caso de erro
  - `cacheTime`: Tempo de cache em ms (padrão: 5min)

### `conversion(eventName, value, properties)`
Rastreia um evento de conversão.

**Parâmetros:**
- `eventName` (string): Nome do evento
- `value` (number): Valor da conversão (opcional)
- `properties` (object): Propriedades adicionais

### `getMetrics(experimentKey)`
Obtém métricas de um experimento.

### `runExperiment(experimentKey, options)`
Executa um experimento completo com callbacks.

## 🔧 Configuração de Produção

1. **Substitua a chave da API:**
   ```javascript
   const rf = new RotaFinal({
     apiKey: 'pk_live_sua_chave_real',
     debug: false // Desativar em produção
   });
   ```

2. **Configure experimentos no dashboard:**
   - Acesse: https://rotafinal.com.br/dashboard
   - Crie projetos e experimentos
   - Configure variantes e métricas

3. **Monitore resultados:**
   - Acompanhe métricas em tempo real
   - Analise significância estatística
   - Ajuste experimentos conforme necessário

## 🚨 Importante

- **Sempre use o script anti-flicker** para evitar flash de conteúdo
- **Teste em ambiente de desenvolvimento** antes de ir para produção
- **Monitore performance** dos experimentos
- **Configure fallbacks** para casos de erro

## 📞 Suporte

Para dúvidas ou problemas:
- Dashboard: https://rotafinal.com.br/dashboard
- Documentação: https://rotafinal.com.br/docs
- Email: suporte@rotafinal.com.br
