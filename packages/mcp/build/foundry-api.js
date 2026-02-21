import axios from 'axios';
export class FoundryApi {
    apiUrl;
    apiKey;
    constructor() {
        // O módulo Three Hats usa um Relay Server para a API REST, e não expõe rotas diretamente no Foundry Core
        this.apiUrl = process.env.FOUNDRY_API_URL || 'https://foundryvtt-rest-api-relay.fly.dev';
        this.apiKey = process.env.FOUNDRY_API_KEY || '';
    }
    cachedClientId = process.env.FOUNDRY_CLIENT_ID || null;
    async getClientId() {
        if (this.cachedClientId)
            return this.cachedClientId;
        try {
            const response = await axios.get(`${this.apiUrl}/clients`, {
                headers: { 'x-api-key': this.apiKey }
            });
            // Tenta obter o ID do primeiro cliente retornado se existir
            if (response.data && response.data.clients && response.data.clients.length > 0) {
                this.cachedClientId = response.data.clients[0].id;
                return this.cachedClientId;
            }
        }
        catch (e) {
            // Se falhar ou a rota não existir (ex: versão puramente local que não usa relay), prossegue silenciosamente
        }
        return '';
    }
    async post(endpoint, payload) {
        try {
            const clientId = await this.getClientId();
            const symbol = endpoint.includes('?') ? '&' : '?';
            const authQuery = clientId ? `${symbol}clientId=${clientId}` : '';
            const url = `${this.apiUrl}${endpoint}${authQuery}`;
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error POST to Foundry API (${endpoint}):`, error?.response?.data || error.message);
            throw error;
        }
    }
    async createActor(data) {
        return this.post('/create', { type: 'Actor', data });
    }
    async createScene(data) {
        return this.post('/create', { type: 'Scene', data });
    }
    async createItem(data) {
        return this.post('/create', { type: 'Item', data });
    }
    async createJournalEntry(data) {
        return this.post('/create', { type: 'JournalEntry', data });
    }
}
