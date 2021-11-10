// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Gartic is Ownable {
    string[] private words;
    mapping(address => bool) played;
    address winner;

    uint256 nbPlayer;

    constructor(uint256 nbP) {
        nbPlayer = nbP;
    }

    //state of the game
    enum State {
        proposal,
        guess,
        end
    }
    State state = State.proposal;

    //events
    event newWord(address player, string word);
    event stateChanged(State enCours);
    event finalResults(string firstWord, string lastWord, address winnerAddr);

    // Add new word to the list
    function StoreWord(string memory _newWord) external {
        require(state == State.proposal, "u cant play");
        require(
            keccak256(abi.encodePacked(_newWord)) !=
                keccak256(abi.encodePacked((getLastWord()))),
            "Can't write same word !"
        );
        require(
            !played[msg.sender],
            /* unicode */
            "u already played"
        );
        words.push(_newWord);
        newPlayer(msg.sender); // pour plus tard

        played[msg.sender] = true;

        emit newWord(msg.sender, _newWord);
        if (words.length == nbPlayer) {
            state = State.guess;
            emit stateChanged(state);
        }
    }

    // Get the words list
    function GetWords() external view onlyOwner returns (string[] memory) {
        return words;
    }

    // Get only the last word
    function getLastWord() public view returns (string memory) {
        if (words.length != 0) {
            return words[words.length - 1];
        } else {
            return "";
        }
    }

    // two ways to finish the game:
    // 1 - compare both last and first
    // 2 - let the player guess what was the first word

    // get the start and end of the game
    function getFirstLast()
        external
        view
        onlyOwner
        returns (string memory first, string memory last)
    {
        require(state == State.guess, "game's not over yet");
        return (words[0], words[nbPlayer - 1]);
    }

    // guessing
    function guessIt(string memory _word) external returns (address) {
        require(state == State.guess, "not guess time yet");
        if (
            keccak256(abi.encodePacked(_word)) !=
            keccak256(abi.encodePacked(words[0]))
        ) {
            return (address(0));
        } else {
            winner = msg.sender;
            state = State.end;
            emit stateChanged(state);
            return winner;
        }
    }

    function getResults() external {
        require(state == State.end, "game's not over yet");
        emit finalResults(words[0], words[nbPlayer - 1], winner);
    }

    // keep all the addresses in an array
    address[] players;

    function newPlayer(address _newplayer) private {
        players.push(_newplayer);
    }

    // main reset function
    function resetGame() public onlyOwner {
        require(state == State.end, "game's not over yet");
        state = State.proposal;
        emit stateChanged(state);
        for (uint256 i = 0; i < nbPlayer; i++) {
            words.pop();
        }
        // delete words;
        winner = address(0);
        noPlayers();
    }

    // reseting the played mapping
    function noPlayers() private {
        for (uint256 i = nbPlayer - 1; i == 0; i--) {
            played[players[i]] == false;
            players.pop();
        }
    }
}
