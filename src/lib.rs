use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    msg,
    sysvar::clock::Clock,
    sysvar::Sysvar,
};
use borsh::{BorshDeserialize, BorshSerialize};
use thiserror::Error;

// Custom error types
#[derive(Error, Debug, Copy, Clone)]
pub enum IoTError {
    #[error("Insufficient balance")]
    InsufficientBalance,
    #[error("Invalid device type")]
    InvalidDeviceType,
    #[error("Invalid message length")]
    InvalidMessageLength,
    #[error("Unauthorized operation")]
    UnauthorizedOperation,
}

impl From<IoTError> for ProgramError {
    fn from(e: IoTError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

// Program instructions
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum IoTInstruction {
    SendMessage {
        message: String,
        recipient: Pubkey,
        message_id: u64,
    },
    ReceiveMessage {
        sender: Pubkey,
        message_id: u64,
    },
    RegisterDevice {
        device_type: String,
        device_id: String,
        owner: Pubkey,
    },
    UpdateDevice {
        new_device_type: String,
        device_id: String,
    },
    DeleteDevice {
        device_id: String,
    },
}

// Device information structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct DeviceInfo {
    pub initialized: bool,
    pub device_type: String,
    pub device_id: String,
    pub owner: Pubkey,
    pub last_activity: i64,
    pub total_messages: u64,
    pub active: bool,
}

// Message structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Message {
    pub message_id: u64,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub content: String,
    pub timestamp: i64,
    pub read: bool,
}

impl DeviceInfo {
    pub fn new(device_type: String, device_id: String, owner: Pubkey, timestamp: i64) -> Self {
        DeviceInfo {
            initialized: true,
            device_type,
            device_id,
            owner,
            last_activity: timestamp,
            total_messages: 0,
            active: true,
        }
    }
}

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey, // Prefixed with underscore to avoid unused variable warning
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = IoTInstruction::deserialize(&mut &instruction_data[..])?;
    let accounts_iter = &mut accounts.iter();
    let clock = Clock::get()?;

    match instruction {
        IoTInstruction::SendMessage { message, recipient, message_id } => {
            msg!("Starting message sending process");

            let sender_account = next_account_info(accounts_iter)?; // Changed to sender_account
            let _recipient_account = next_account_info(accounts_iter)?; // Prefixed with underscore to avoid unused variable warning
            let message_account = next_account_info(accounts_iter)?;

            if !sender_account.is_signer {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            if message.len() > 1000 {
                return Err(IoTError::InvalidMessageLength.into());
            }

            let new_message = Message {
                message_id,
                sender: *sender_account.key,
                recipient,
                content: message,
                timestamp: clock.unix_timestamp,
                read: false,
            };

            borsh::to_writer(&mut &mut message_account.data.borrow_mut()[..], &new_message)?;
            msg!("Message successfully saved");
        },

        IoTInstruction::RegisterDevice { device_type, device_id, owner } => {
            msg!("Starting device registration process");

            let admin_account = next_account_info(accounts_iter)?;
            let device_account = next_account_info(accounts_iter)?;

            if !admin_account.is_signer {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            if device_type.len() > 50 {
                return Err(IoTError::InvalidDeviceType.into());
            }

            let device_info = DeviceInfo::new(
                device_type,
                device_id,
                owner,
                clock.unix_timestamp,
            );

            borsh::to_writer(&mut &mut device_account.data.borrow_mut()[..], &device_info)?;
            msg!("Device successfully registered");
        },

        IoTInstruction::UpdateDevice { new_device_type, device_id } => {
            msg!("Starting device update process");

            let admin_account = next_account_info(accounts_iter)?;
            let device_account = next_account_info(accounts_iter)?;

            if !admin_account.is_signer {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            let mut device_info: DeviceInfo = borsh::from_slice(&device_account.data.borrow())?;

            if device_info.device_id != device_id {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            device_info.device_type = new_device_type;
            device_info.last_activity = clock.unix_timestamp;

            borsh::to_writer(&mut &mut device_account.data.borrow_mut()[..], &device_info)?;
            msg!("Device successfully updated");
        },

        IoTInstruction::DeleteDevice { device_id } => {
            msg!("Starting device deletion process");

            let admin_account = next_account_info(accounts_iter)?;
            let device_account = next_account_info(accounts_iter)?;

            if !admin_account.is_signer {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            let mut device_info: DeviceInfo = borsh::from_slice(&device_account.data.borrow())?;

            if device_info.device_id != device_id {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            device_info.active = false;
            device_info.last_activity = clock.unix_timestamp;

            borsh::to_writer(&mut &mut device_account.data.borrow_mut()[..], &device_info)?;
            msg!("Device successfully deleted");
        },

        IoTInstruction::ReceiveMessage { sender: _, message_id } => {
            msg!("Starting message receiving process");

            let recipient_account = next_account_info(accounts_iter)?;
            let message_account = next_account_info(accounts_iter)?;

            if !recipient_account.is_signer {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            let mut message: Message = borsh::from_slice(&message_account.data.borrow())?;

            if message.message_id != message_id || message.recipient != *recipient_account.key {
                return Err(IoTError::UnauthorizedOperation.into());
            }

            message.read = true;
            borsh::to_writer(&mut &mut message_account.data.borrow_mut()[..], &message)?;
            msg!("Message successfully received and marked as read");
        },
    }

    Ok(())
}
