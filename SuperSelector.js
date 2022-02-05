class CommandParser {
    static parseCommandArray(commandArray){
        let result = []
        commandArray = commandArray.split('.')
        for (let i in commandArray){
            result.push({
                type: 'function',
                command: commandArray[i].split('(')[0],
                params: CommandParser.parseCommandArgs(commandArray[i])
            })
        }
        return result;
    }
    static parseCommandArgs(command){
        let args = []
        let argStrings = command.substring(
            command.indexOf("(") + 1,
            command.lastIndexOf(")")
        );
        if(argStrings.length <= 1 && argStrings[0] == ''){
            return null;
        }
        argStrings = argStrings.split(',')
        for (let i in argStrings){
            let arg = argStrings[i]
            let newArg = arg.substring(arg.indexOf('"') + 1, arg.lastIndexOf('"'));
            if(newArg == ''){
                newArg = arg.substring(arg.indexOf("'") + 1, arg.lastIndexOf("'"));
                if(newArg == ''){
                    newArg = arg;
                }
            }
            args.push(newArg)
        }
        return args;
    }
    static parseCommand(command){
        let parsedOrderedCommand = [];
        let commandMethods = command.split('|')
        for (let i in commandMethods){
            let command = commandMethods[i]
            if(command.includes(').')){
                parsedOrderedCommand.push(...CommandParser.parseCommandArray(command))
            }else if(command.match(/^((?!\:).)*\(/)){
                parsedOrderedCommand.push({
                    type: 'function',
                    command: command.split('(')[0].replaceAll(' ', ''),
                    params: CommandParser.parseCommandArgs(command)
                })
            }else if(command.match(/^((?![^\s]).)*\[/g)){
                parsedOrderedCommand.push({
                    type: 'arrayPosition',
                    command: parseInt(command.replace('[', '').replace(']', '').replaceAll(' ', ''))
                })
            }else{
                parsedOrderedCommand.push(commandMethods[i])
            }
        }
        return parsedOrderedCommand
    }
}
class SuperSelectorAssistant{
    static matchProp(element, prop, match){
        let result = [];
        if(!Array.isArray(element)){
            element = [element]
        }
        for (let i in element){
            let currentElement = element[i]
            if(typeof currentElement[prop] == 'string' && new RegExp(match).test(currentElement[prop])){
                result.push(currentElement)
            }
        }
        return result;
    }

    static recursiveProp(element, attr, times=1){
        if(times <= 0){
            return element;
        }
        return SuperSelectorAssistant.recursiveProp(SuperSelectorAssistant.p(element, attr), attr, times-1)
    }
    //Alias for getProp
    static p(element, attr){
        return SuperSelectorAssistant.getProp(element, attr)
    }
    static getProp(element, attr){
        let result = null;
        if(Array.isArray(element)){
            result = []
            for (let i in element){
                if(typeof element[i][attr] != 'undefined'){
                    result.push(element[i][attr])
                }
            }
        }else{
            if(typeof element[attr] != "undefined"){
                result = element[attr];
            }
        }
        return result;
    }
    static propIncludes(element, prop, string){
        if(typeof element[prop] != 'undefined' && element[prop].includes(string)){
            return element;
        }
        return null;
    }
    static propIncludesLowercase(element, prop, string){
        if(typeof element[prop] != 'undefined' && element[prop].toLowerCase().includes(string.toLowerCase())){
            return element;
        }
        return null;
    }
}
class SuperSelector {
    static superSelector(selector = null, element = null){
        if(element == null || selector == null){
            return null;
        }
        try{
            let commands = CommandParser.parseCommand(selector)
            for (let command of commands){
                if(NodeList.prototype.isPrototypeOf(element)){
                    element = Array.from(element)
                }
                if(typeof command == "string"){
                    element = element.querySelectorAll(command)
                }else if (command.type == "function"){
                    let resElement = []
                    if(!Array.isArray(element)){
                        element = [element]
                    }
                    for (let i in element){
                        let currentElement = element[i]
                        if(SuperSelectorAssistant.hasOwnProperty(command.command)){
                            let commandRes = SuperSelectorAssistant[command.command](currentElement,...command.params)
                            if(commandRes != null){
                                resElement.push(commandRes)
                            }
                        }else if(typeof currentElement[command.command] == 'function'){
                            resElement.push(currentElement[command.command](...command.params))
                        }else{
                            resElement.push(currentElement[command.command])
                        }
                    }
                    element = resElement;
                }else if (command.type == "arrayPosition"){
                    element = element[command.command]
                }else{
                    return null;
                }
            }
            if(NodeList.prototype.isPrototypeOf(element)){
                element = Array.from(element)
            }
            if(typeof element == 'undefined'){
                return null;
            }
            return element;
        }catch (e){
            console.log(e)
            return null;
        }
    }
    static findElement(string, element = document){
        let selector = string;
        if(selector.includes('|')){
            return SuperSelector.superSelector(selector, element)[0];
        }
        try{
            return element.querySelectorAll(selector)[0]
        }catch (e){
            return null;
        }
    }
}

module.exports = SuperSelector