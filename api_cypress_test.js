describe('Trello API Automation', () => {
  let API_KEY;
  let API_TOKEN;
  let boardId; 
  let listId;  
  let cardId; 

  before(() => {
    API_KEY = Cypress.env('trelloApiKey');
    API_TOKEN = Cypress.env('trelloApiToken');

    if (!API_KEY || !API_TOKEN) {
      throw new Error('Trello API Key and Token must be set as Cypress environment variables.');
    }

    cy.request({
      method: 'POST',
      url: `https://api.trello.com/1/boards/?key=${API_KEY}&token=${API_TOKEN}&name=Test Board for Automation`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      boardId = response.body.id;
      cy.log(`Board criado: ${response.body.name} (ID: ${boardId})`);

      cy.request({
        method: 'GET',
        url: `https://api.trello.com/1/boards/${boardId}/lists?key=${API_KEY}&token=${API_TOKEN}`,
      }).then((listResponse) => {
        expect(listResponse.status).to.eq(200);
        expect(listResponse.body).to.have.length.at.least(1);
        listId = listResponse.body[0].id; 
        cy.log(`Lista padrão obtida: ${listResponse.body[0].name} (ID: ${listId})`);
      });
    });
  });

  after(() => {
    if (boardId) {
      cy.log(`Excluindo board: ${boardId}`);
      cy.request({
        method: 'DELETE',
        url: `https://api.trello.com/1/boards/${boardId}?key=${API_KEY}&token=${API_TOKEN}`,
        failOnStatusCode: false // Não falhar o teste se a exclusão falhar, apenas registrar
      }).then((response) => {
        if (response.status === 200) {
          cy.log('Board excluído com sucesso.');
        } else {
          cy.log(`Falha ao excluir board: Status ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }
      });
    }
  });

  it('Deve cadastrar um board com sucesso', () => {
    cy.request({
      method: 'POST',
      url: `https://api.trello.com/1/boards/?key=${API_KEY}&token=${API_TOKEN}&name=Novo Board Teste`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.eq('Novo Board Teste');
      cy.log(`Novo board 'Novo Board Teste' criado com ID: ${response.body.id}`);
    });
  });

  it('Deve cadastrar um card em um board existente', () => {
    const cardName = 'Novo Card de Teste';
    cy.request({
      method: 'POST',
      url: `https://api.trello.com/1/cards?key=${API_KEY}&token=${API_TOKEN}&idList=${listId}&name=${cardName}`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.eq(cardName);
      expect(response.body.idList).to.eq(listId);
      cardId = response.body.id; // Salvar o ID do card para exclusão
      cy.log(`Card '${cardName}' criado com ID: ${cardId} na lista ${listId}`);
    });
  });

  it('Deve excluir um card existente', () => {
    expect(cardId, 'Card ID deve estar definido para exclusão').to.exist;
    cy.request({
      method: 'DELETE',
      url: `https://api.trello.com/1/cards/${cardId}?key=${API_KEY}&token=${API_TOKEN}`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body._value).to.eq(null); 
      cy.log(`Card com ID ${cardId} excluído com sucesso.`);

      cy.request({
        method: 'GET',
        url: `https://api.trello.com/1/cards/${cardId}?key=${API_KEY}&token=${API_TOKEN}`,
        failOnStatusCode: false // Esperamos 404
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(404); // Not Found
        cy.log(`Verificação: Card ID ${cardId} não encontrado (status 404) após exclusão.`);
      });
    });
  });

  it('Deve excluir um board existente', () => {
    let tempBoardId;
    cy.request({
      method: 'POST',
      url: `https://api.trello.com/1/boards/?key=${API_KEY}&token=${API_TOKEN}&name=Board para Exclusão`,
    }).then((createResponse) => {
      expect(createResponse.status).to.eq(200);
      tempBoardId = createResponse.body.id;
      cy.log(`Board temporário 'Board para Exclusão' criado com ID: ${tempBoardId}`);

      cy.request({
        method: 'DELETE',
        url: `https://api.trello.com/1/boards/${tempBoardId}?key=${API_KEY}&token=${API_TOKEN}`,
      }).then((deleteResponse) => {
        expect(deleteResponse.status).to.eq(200);
        expect(deleteResponse.body._value).to.eq(null);
        cy.log(`Board com ID ${tempBoardId} excluído com sucesso.`);

        cy.request({
          method: 'GET',
          url: `https://api.trello.com/1/boards/${tempBoardId}?key=${API_KEY}&token=${API_TOKEN}`,
          failOnStatusCode: false
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(404);
          cy.log(`Verificação: Board ID ${tempBoardId} não encontrado (status 404) após exclusão.`);
        });
      });
    });
  });
});
