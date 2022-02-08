import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import React from 'react';
import appConfig from '../config.json';
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { ButtonSendSticker } from '../src/components/ButtonSendSticker'


export default function ChatPage() {
    // Usado para obter o nome do usuário via URL
    const roteamento = useRouter();
    const username = roteamento.query.username;

    // Estados contendo a mensagem digitada
    const [message, setMessage] = React.useState('');
    const [messageList, setMessageList] = React.useState([]);

    // usado para animação do loading
    const [messagesLoaded, setMessagesLoaded] = React.useState(false);
    const [messageSent, setMessageSent] = React.useState(true);

    // Database Logic
    const SUPA_BASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0Mzg5NDgwMSwiZXhwIjoxOTU5NDcwODAxfQ.WVBMx9TN8fS_mCo7tR3Rrv80fruyShPGJZGXlKRkpDE"
    const SUPA_BASE_URL = "https://nxzgqmtkwgoeggmrstfg.supabase.co";
    const supabase = createClient(SUPA_BASE_URL, SUPA_BASE_ANON_KEY);

    // Ouver por inserções de dados e chama o atualizador da lista offline
    function OuvePorNovasMensagens() {
        supabase
            .from('mensagens')
            .on('INSERT', (ultimaMensagensInserida) => {
                atualizaListaDeMensagens([ultimaMensagensInserida.new]);
            }).subscribe()
    }

    // Puxa todas mensagens do servidor, executado apenas a primeira vez
    function puxaMensagens() {
        supabase.from('mensagens')
            .select('*')
            .order('id', { ascending: false })
            .then(({ data }) => {
                console.log('puxado', data.length, 'mensagens')
                setMessagesLoaded(true)
                atualizaListaDeMensagens(data)
            })
    }

    // Atualiza a cópia das mensagens offline adicionando uma nova mensagem a lista
    function atualizaListaDeMensagens(mensagemNova) {
        setMessageList((messageListUpdated) => {
            return [
                ...mensagemNova,
                ...messageListUpdated]
        })
    }

    // Executado somente a primeira vez que o componente é carregado
    React.useEffect(
        function () {
            console.log('puxando mensagens do servidor');
            setMessagesLoaded(false);
            puxaMensagens();
            OuvePorNovasMensagens();
        }, [])

    // Visual
    return (

        <Box
            styleSheet={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: appConfig.theme.colors.primary[500],
                backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
                backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
                color: appConfig.theme.colors.neutrals['000']
            }}
        >
            <Box
                styleSheet={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
                    borderRadius: '5px',
                    backgroundColor: appConfig.theme.colors.neutrals[700],
                    height: '100%',
                    maxWidth: '95%',
                    maxHeight: '95vh',
                    padding: {
                        xs: '5px',
                        sm: '32px'
                    }
                }}
            >
                <Header />
                <Box
                    styleSheet={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'end',
                        flex: 1,
                        height: '80%',
                        backgroundColor: appConfig.theme.colors.neutrals[600],
                        flexDirection: 'column',
                        borderRadius: '5px',
                        padding: '16px',
                    }}
                >
                    <MessageList messagesList={messageList} />

                    {/* Mensagem de status */}
                    <Text tag="span">
                        {(!messagesLoaded) ? <Loading text="Carregando Mensagens" /> : null}
                        {(!messageSent) ? <Loading text="Enviando" /> : null}
                    </Text>

                    <MessageForm userName={username} setMessageSent={setMessageSent} dataBase={supabase} />

                </Box>
            </Box>
        </Box>
    )
}

// Components
function Header() {
    return (
        <>
            <Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                <Text variant='heading5'>
                    Chat
                </Text>
                <Button
                    variant='tertiary'
                    colorVariant='neutral'
                    label='Logout'
                    href="/"
                />
            </Box>
        </>
    )
}

class MessageForm extends React.Component {
    constructor(props) {
        super(props);
        this.username = props.userName;
        this.supabase = props.dataBase;
        this.setMessageSent = props.setMessageSent;
        this.state = {
            message: '',
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // Atualiza o valor da mensagem a medida que é digitado
    handleChange(ev) {
        this.setState({ message: ev.target.value });
    }

    handleKeyPress(ev) {
        if (ev.key == 'Enter' && (!ev.shiftKey)) {
            ev.preventDefault();
            this.sendMessage();
        }
    }

    handleSubmit(ev) {
        ev.preventDefault();
        this.sendMessage();
    }

    // Checa e envia mensagem ao servidor
    sendMessage() {
        console.log("tentativa de envio de", this.state.message)
        // Evita mensagem vazia
        if (this.state.message == '')
            return

        // Cria um objeto contendo os campos necessários
        let objMessage = {
            // id: messageList.length + 2,
            de: this.username,
            texto: this.state.message,
        }

        // Limpa o campo previnindo envio múltiplo
        this.setState({ message: '' });
        this.setMessageSent(false);

        //Faz um novo insert do objeto mensagem no banco de dados
        this.supabase.from('mensagens')
            .insert([
                objMessage
            ])
            .then(({ data }) => {
                console.log('enviado ', data[0].texto)
                this.setMessageSent(true)
            })
    }

    render() {
        return (
            <Box
                as="form"
                styleSheet={{
                    display: 'flex',
                    alignItems: 'center',
                }}
                onSubmit={this.handleSubmit}
            >
                <ButtonSendSticker
                    onStickerClick={(stickerURL) => {
                        this.setState({ message: `:sticker:${stickerURL}` }, this.sendMessage);;
                    }} />

                <TextField
                    placeholder="Insira sua mensagem aqui..."
                    value={this.state.message}
                    type="textarea"
                    styleSheet={{
                        display: 'flex',
                        width: '100%',
                        border: '0',
                        resize: 'none',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        backgroundColor: appConfig.theme.colors.neutrals[800],
                        marginRight: '12px',
                        color: appConfig.theme.colors.neutrals[200],
                    }}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
                <Button type='submit'
                    label='Send'
                    size='sm'
                    buttonColors={{
                        contrastColor: appConfig.theme.colors.neutrals["000"],
                        mainColor: appConfig.theme.colors.primary[500],
                        mainColorLight: appConfig.theme.colors.primary[400],
                        mainColorStrong: appConfig.theme.colors.primary[600],
                    }}
                />
            </Box>
        )
    }
}

function MessageList(props) {
    console.log('renderizando lista')
    return (
        <Box
            tag="ul"
            styleSheet={{
                overflow: 'scroll',
                display: 'flex',
                flexDirection: 'column-reverse',
                flex: 1,
                color: appConfig.theme.colors.neutrals["000"],
                marginBottom: '16px',
            }}
        >
            { // Renderiza cada mensagem da lista
                props.messagesList.map(
                    function (mensagem) {
                        return (
                            <Baloon messageObject={mensagem} key={mensagem.id}>
                                <Text
                                    styleSheet={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        color: appConfig.theme.colors.neutrals['000'],
                                    }}
                                >
                                    <Box
                                        styleSheet={{
                                            display: 'flex',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <Image
                                            styleSheet={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                marginRight: '8px',
                                            }}
                                            src={`https://github.com/${mensagem.de}.png`}
                                        />
                                        <Text tag="strong">
                                            {mensagem.de}
                                        </Text>
                                        <Text
                                            styleSheet={{
                                                fontSize: '10px',
                                                marginLeft: '8px',
                                                color: appConfig.theme.colors.neutrals[300],
                                            }}
                                            tag="span"
                                        >

                                        </Text>
                                    </Box>
                                    {mensagem.texto.startsWith(':sticker:') ?
                                        <StickerContainer src={mensagem.texto.replace(':sticker:', '')} />
                                        : <Text>{mensagem.texto}</Text>
                                    }
                                    <Text
                                        styleSheet={{
                                            alignSelf: 'end',
                                            fontSize: '0.5em',
                                            hover: {
                                                fontSize: '1em',
                                            }
                                        }}
                                    >
                                        {(new Date(mensagem.created_at).toLocaleString())}
                                    </Text>
                                </Text>
                            </Baloon>
                        )
                    }
                )
            }
        </Box>
    )
}

function StickerContainer(props) {
    const URL = props.src;
    return (
        <Image src={URL}
            styleSheet={{
                width: '15%',
                height: '15%',
            }}
        />
    )
}

function Baloon(props) {
    const mensagem = props.messageObject;
    return (
        <div
            className={mensagem.de == 'isjacrod' ? 'left_aligned' : 'right_aligned'}>
            {props.children}
            <style jsx>{`
            div {
                box-shadow: inset -3px -3px 0 1px, inset 1px 1px 0 1px;
                color: ${appConfig.theme.colors.primary['500']};
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 12px;
                width: 70%;
            }
            div:hover {
                background-color: ${appConfig.theme.colors.neutrals['700']};
            }
            .right_aligned {
                align-self: end;
                border-radius: 20px 20px 0px 20px;
            }
            .left_aligned {
                align-self: start;
                border-radius: 20px 20px 20px 0px;
            }
        `}</style>
        </div>
    )

}

// Animação que cria um texto com pontinhos
class Loading extends React.Component {
    constructor(props) {
        super(props);
        this.text = props.text;
        this.state = { dots: '.' };
        this.addDots = this.addDots.bind(this)
    }

    render() {
        return (
            <Text>{this.text}{this.state.dots}</Text>
        );
    }

    addDots() {
        if (this.state.dots === '...')
            this.setState({ dots: '.' })
        else
            this.setState({ dots: (this.state.dots + '.') })
    }

    componentDidMount() {
        this.timer = setInterval(
            this.addDots, 500
        )
    }

    componentWillUnmount() {
        clearInterval(this.timer)
    }
}