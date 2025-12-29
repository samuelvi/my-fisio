"use strict";

export interface RouteToken {
    0: string;
    1: string | number;
    2?: string;
    3?: string;
    4?: boolean;
    5?: boolean;
}

export interface RouteDefinition {
    tokens: RouteToken[][];
    defaults: Record<string, any>;
    requirements: Record<string, string>;
    hosttokens: RouteToken[][];
    methods: string[];
    schemes: string[];
}

export interface RoutingData {
    base_url: string;
    routes: Record<string, RouteDefinition>;
    prefix: string;
    host: string;
    port: string | number;
    scheme: string;
    locale: string;
}

export class Router {
    private context_: {
        base_url: string;
        prefix: string;
        host: string;
        port: string | number;
        scheme: string;
        locale: string;
    };
    private routes_: Record<string, RouteDefinition> = {};

    constructor(context?: any, routes?: Record<string, RouteDefinition>) {
        this.context_ = context || { base_url: '', prefix: '', host: '', port: '', scheme: '', locale: '' };
        this.setRoutes(routes || {});
    }

    static getInstance(): Router {
        return Routing;
    }

    static setData(data: RoutingData): void {
        var router = Router.getInstance();
        router.setRoutingData(data);
    }

    setRoutingData(data: RoutingData): void {
        this.setBaseUrl(data['base_url']);
        this.setRoutes(data['routes']);
        if (typeof data.prefix !== 'undefined') {
            this.setPrefix(data['prefix']);
        }
        if (typeof data.port !== 'undefined') {
            this.setPort(data['port']);
        }
        if (typeof data.locale !== 'undefined') {
            this.setLocale(data['locale']);
        }
        this.setHost(data['host']);
        if (typeof data.scheme !== 'undefined') {
            this.setScheme(data['scheme']);
        }
    }

    setRoutes(routes: Record<string, RouteDefinition>): void {
        this.routes_ = Object.freeze(routes);
    }

    getRoutes(): Record<string, RouteDefinition> {
        return this.routes_;
    }

    setBaseUrl(baseUrl: string): void {
        this.context_.base_url = baseUrl;
    }

    getBaseUrl(): string {
        return this.context_.base_url;
    }

    setPrefix(prefix: string): void {
        this.context_.prefix = prefix;
    }

    setScheme(scheme: string): void {
        this.context_.scheme = scheme;
    }

    getScheme(): string {
        return this.context_.scheme;
    }

    setHost(host: string): void {
        this.context_.host = host;
    }

    getHost(): string {
        return this.context_.host;
    }

    setPort(port: string | number): void {
        this.context_.port = port;
    }

    getPort(): string | number {
        return this.context_.port;
    }

    setLocale(locale: string): void {
        this.context_.locale = locale;
    }

    getLocale(): string {
        return this.context_.locale;
    }

    buildQueryParams(prefix: string, params: any, add: (key: string, value: any) => void): void {
        var _this = this;
        var name;
        var rbracket = new RegExp(/\[\]$/);
        if (params instanceof Array) {
            params.forEach(function (val, i) {
                if (rbracket.test(prefix)) {
                    add(prefix, val);
                }
                else {
                    _this.buildQueryParams(prefix + '[' + (typeof val === 'object' ? i : '') + ']', val, add);
                }
            });
        }
        else if (typeof params === 'object') {
            for (name in params) {
                this.buildQueryParams(prefix + '[' + name + ']', params[name], add);
            }
        }
        else {
            add(prefix, params);
        }
    }

    getRoute(name: string): RouteDefinition {
        var prefixedName = this.context_.prefix + name;
        var sf41i18nName = name + '.' + this.context_.locale;
        var prefixedSf41i18nName = this.context_.prefix + name + '.' + this.context_.locale;
        var variants = [prefixedName, sf41i18nName, prefixedSf41i18nName, name];
        for (var i in variants) {
            if (variants[i] in this.routes_) {
                return this.routes_[variants[i]];
            }
        }
        throw new Error('The route "' + name + '" does not exist.');
    }

    generate(name: string, opt_params?: any, absolute?: boolean): string {
        var route = (this.getRoute(name));
        var params = opt_params || {};
        var unusedParams = Object.assign({}, params);
        var url = '';
        var optional = true;
        var host = '';
        var port = (typeof this.getPort() == 'undefined' || this.getPort() === null) ? '' : this.getPort();
        
        // Use any to avoid complex tuple indexing issues in migration
        (route.tokens as any[]).forEach(function (token: any) {
            if ('text' === token[0] && typeof token[1] === 'string') {
                url = Router.encodePathComponent(token[1]) + url;
                optional = false;
                return;
            }
            if ('variable' === token[0]) {
                if (token.length === 6 && token[5] === true) {
                    optional = false;
                }
                var hasDefault = route.defaults && !Array.isArray(route.defaults) && typeof token[3] === 'string' && (token[3] in route.defaults);
                if (false === optional || !hasDefault || ((typeof token[3] === 'string' && token[3] in params) && !Array.isArray(route.defaults) && params[token[3]] != route.defaults[token[3]])) {
                    var value = void 0;
                    if (typeof token[3] === 'string' && token[3] in params) {
                        value = params[token[3]];
                        delete unusedParams[token[3]];
                    }
                    else if (typeof token[3] === 'string' && hasDefault && !Array.isArray(route.defaults)) {
                        value = route.defaults[token[3]];
                    }
                    else if (optional) {
                        return;
                    }
                    else {
                        throw new Error('The route "' + name + '" requires the parameter "' + token[3] + '".');
                    }
                    var empty = true === value || false === value || '' === value;
                    if (!empty || !optional) {
                        var encodedValue = Router.encodePathComponent(value);
                        if ('null' === encodedValue && null === value) {
                            encodedValue = '';
                        }
                        url = token[1] + encodedValue + url;
                    }
                    optional = false;
                }
                else if (hasDefault && (typeof token[3] === 'string' && token[3] in unusedParams)) {
                    delete unusedParams[token[3]];
                }
                return;
            }
            throw new Error('The token type "' + token[0] + '" is not supported.');
        });
        if (url === '') {
            url = '/';
        }
        
        (route.hosttokens as any[]).forEach(function (token: any) {
            var value;
            if ('text' === token[0]) {
                host = token[1] + host;
                return;
            }
            if ('variable' === token[0]) {
                if (token[3] in params) {
                    value = params[token[3]];
                    delete unusedParams[token[3]];
                }
                else if (route.defaults && !Array.isArray(route.defaults) && (token[3] in route.defaults)) {
                    value = route.defaults[token[3]];
                }
                host = token[1] + value + host;
            }
        });
        url = this.context_.base_url + url;
        if (route.requirements && ('_scheme' in route.requirements) && this.getScheme() != route.requirements['_scheme']) {
            var currentHost = host || this.getHost();
            url = route.requirements['_scheme'] + '://' + currentHost + (currentHost.indexOf(':' + port) > -1 || '' === port ? '' : ':' + port) + url;
        }
        else if ('undefined' !== typeof route.schemes && 'undefined' !== typeof route.schemes[0] && this.getScheme() !== route.schemes[0]) {
            var currentHost = host || this.getHost();
            url = route.schemes[0] + '://' + currentHost + (currentHost.indexOf(':' + port) > -1 || '' === port ? '' : ':' + port) + url;
        }
        else if (host && this.getHost() !== host + (host.indexOf(':' + port) > -1 || '' === port ? '' : ':' + port)) {
            url = this.getScheme() + '://' + host + (host.indexOf(':' + port) > -1 || '' === port ? '' : ':' + port) + url;
        }
        else if (absolute === true) {
            url = this.getScheme() + '://' + this.getHost() + (this.getHost().indexOf(':' + port) > -1 || '' === port ? '' : ':' + port) + url;
        }
        if (Object.keys(unusedParams).length > 0) {
            var queryParams_1: string[] = [];
            var add = function (key: string, value: any) {
                value = (typeof value === 'function') ? value() : value;
                value = (value === null) ? '' : value;
                queryParams_1.push(Router.encodeQueryComponent(key) + '=' + Router.encodeQueryComponent(value));
            };
            for (var prefix in unusedParams) {
                if (unusedParams.hasOwnProperty(prefix)) {
                    this.buildQueryParams(prefix, unusedParams[prefix], add);
                }
            }
            url = url + '?' + queryParams_1.join('&');
        }
        return url;
    }

    static customEncodeURIComponent(value: any): string {
        return encodeURIComponent(value)
            .replace(/%2F/g, '/')
            .replace(/%40/g, '@')
            .replace(/%3A/g, ':')
            .replace(/%21/g, '!')
            .replace(/%3B/g, ';')
            .replace(/%2C/g, ',')
            .replace(/%2A/g, '*')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/'/g, '%27');
    }

    static encodePathComponent(value: any): string {
        return Router.customEncodeURIComponent(value)
            .replace(/%3D/g, '=')
            .replace(/%2B/g, '+')
            .replace(/%21/g, '!')
            .replace(/%7C/g, '|');
    }

    static encodeQueryComponent(value: any): string {
        return Router.customEncodeURIComponent(value)
            .replace(/%3F/g, '?');
    }
}

export const Routing = new Router();
export default Routing;
