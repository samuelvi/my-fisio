<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Function;

use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\AST\Node;
use Doctrine\ORM\Query\Parser;
use Doctrine\ORM\Query\SqlWalker;
use Doctrine\ORM\Query\TokenType;

/**
 * UnaccentFunction ::= "UNACCENT" "(" StringPrimary ")"
 */
final class UnaccentFunction extends FunctionNode
{
    private Node|string $stringPrimary;

    public function getSql(SqlWalker $sqlWalker): string
    {
        return 'unaccent('.$this->stringPrimary->dispatch($sqlWalker).')';
    }

    public function parse(Parser $parser): void
    {
        $parser->match(TokenType::T_IDENTIFIER);
        $parser->match(TokenType::T_OPEN_PARENTHESIS);

        $this->stringPrimary = $parser->StringPrimary();

        $parser->match(TokenType::T_CLOSE_PARENTHESIS);
    }
}
