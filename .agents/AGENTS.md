# Regras de Manutenção Proativa do Painel Admin (Parafestas)

1. **Autorização Permanente**: Você (Antigravity) possui autorização total e permanente para manter o Painel Admin compatível com novos eventos, tags e atualizações do sistema (Pixel, CAPI, formulários). Não é necessário pedir permissão ao usuário para implementar otimizações lógicas no código do Admin.
2. **Design Escalável**: Sempre que for mexer no código de processamento de eventos (como gráficos ou CRM), garanta que ele seja à prova de falhas para eventos não mapeados. Nunca hard-code variáveis limitadas (ex: listas fixas de cores para gráficos ou colunas fixas impossíveis de adaptar). Se um evento novo entrar, o Admin deve abraçá-lo automaticamente.
3. **Autonomia**: Haja de forma proativa. Sempre que detectar incongruências na arquitetura de rastreamento versus exibição no dashboard, corrija imediatamente no código e apenas notifique o usuário (usando `walkthrough.md`) sobre a melhoria que foi realizada.
