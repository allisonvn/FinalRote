# 🚀 RotaFinal - Guia de Uso Simples

## ✨ Agora SEM necessidade de chave de API!

### 📦 Instalação Ultra-Simples

1. **Adicione o script no seu HTML:**
```html
<script src="https://seu-dominio.com/rotafinal-sdk.js"></script>
```

2. **Inicialize (zero configuração!):**
```javascript
const rf = new RotaFinal({
    debug: true // opcional
});
```

### 🧪 Executar Teste A/B

```javascript
// 1. Obter variante
const variant = await rf.getVariant('nome-do-experimento');

// 2. Aplicar variante
if (variant === 'a') {
    // Mostrar versão A
} else if (variant === 'b') {
    // Mostrar versão B  
} else {
    // Mostrar versão de controle
}
```

### 📊 Rastrear Conversões

```javascript
// Rastrear qualquer evento
rf.conversion('botao_clicado', 1, {
    page: 'homepage',
    categoria: 'cta'
});
```

### 📈 Ver Métricas

```javascript
const metrics = await rf.getMetrics('nome-do-experimento');
console.log(metrics);
```

## 🎯 Exemplo Completo

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meu Teste A/B</title>
</head>
<body>
    <!-- Versão A -->
    <div id="version-a" style="display: none;">
        <h1>Oferta Especial!</h1>
        <button onclick="rf.conversion('compra', 50)">Comprar</button>
    </div>

    <!-- Versão B -->
    <div id="version-b" style="display: none;">
        <h1>Últimas Unidades!</h1>
        <button onclick="rf.conversion('compra', 50)">Garantir</button>
    </div>

    <!-- SDK RotaFinal -->
    <script src="/rotafinal-sdk.js"></script>
    <script>
        // Inicializar
        const rf = new RotaFinal();

        // Executar teste
        async function runTest() {
            const variant = await rf.getVariant('teste-homepage');
            
            if (variant === 'a') {
                document.getElementById('version-a').style.display = 'block';
            } else {
                document.getElementById('version-b').style.display = 'block';
            }
        }

        // Executar quando página carregar
        document.addEventListener('DOMContentLoaded', runTest);
    </script>
</body>
</html>
```

## 🔧 Configurações Opcionais

```javascript
const rf = new RotaFinal({
    debug: true,                    // Logs no console
    baseUrl: 'https://custom.com'   // URL personalizada
});
```

## ❓ Por que ficou mais simples?

### ❌ Antes (complexo):
- Precisava gerar chave de API
- Configurar autenticação 
- Gerenciar permissões
- Mais código para configurar

### ✅ Agora (simples):
- Zero configuração de chaves
- Funciona imediatamente
- Plug-and-play
- Apenas 3 linhas de código!

## 🎉 Resultado

Reduzimos de **15+ linhas** de configuração para apenas **3 linhas**:

```javascript
const rf = new RotaFinal();
const variant = await rf.getVariant('meu-teste');
rf.conversion('evento', 1);
```

**Pronto! Seu teste A/B está funcionando! 🚀**
