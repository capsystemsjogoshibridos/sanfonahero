# Publicar e jogar offline

1. Crie um repositório no GitHub (público, se usar Pages no plano gratuito).
2. Extraia este ZIP e envie seu CONTEÚDO para a raiz do repositório. Não envie apenas o ZIP.
3. No GitHub, abra Settings > Pages. Em Build and deployment, selecione Deploy from a branch; escolha main e /(root); salve.
4. Aguarde o endereço informado pelo Pages. Abra-o diretamente no Safari ou Firefox, fora do iframe do catálogo.
5. Espere a mensagem “Pronto para jogar offline”. No iPhone, use Compartilhar > Adicionar à Tela de Início; abra pelo ícone ainda com internet e confira a mensagem novamente.
6. Agora desligue a internet e abra pelo mesmo ícone/endereço. As quatro músicas, cenários e o detector estão salvos. Autorize a câmera. A calibração só precisa ser feita uma vez: fica salva no aparelho e é reutilizada entre músicas e acessos. Use Refazer calibração se mudar a posição/distância do celular ou da sanfona.

O GitHub Pages precisa servir o endereço por HTTPS. Todos os caminhos são relativos, inclusive o service worker, para funcionar em usuario.github.io/nome-do-repositorio/.

O primeiro acesso requer internet. Abrir index.html como arquivo local não instala o modo offline. Se o sistema limpar o armazenamento do site, conecte-se novamente e use Tentar novamente. Atualizações só são aplicadas pelo botão Atualizar jogo, para não interromper partidas.

Esta é a edição independente. Não envie este ZIP ao catálogo: ele utiliza service worker/cache e recordes locais, recursos diferentes das regras do sandbox do catálogo. Os arquivos da edição do catálogo continuam separados.

Nenhuma câmera é gravada ou enviada. O processamento ocorre localmente. O Safari no aparelho real ainda deve ser testado; solicitações parciais de áudio (Range) são atendidas pelo cache para compatibilidade com reprodução offline.
